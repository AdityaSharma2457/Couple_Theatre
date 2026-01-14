import os
from flask import Blueprint, request, jsonify, Response, send_from_directory, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from bson.errors import InvalidId
from models.video_model import create_video, mark_ready, mark_failed
import uuid
import subprocess
import threading

video_bp = Blueprint("video", __name__)

# Video upload api
# Get the absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

UPLOAD_ORIGINAL = os.path.join(BACKEND_DIR, "uploads", "originals")
UPLOAD_HLS = os.path.join(BACKEND_DIR, "uploads", "hls")

os.makedirs(UPLOAD_ORIGINAL, exist_ok=True)
os.makedirs(UPLOAD_HLS, exist_ok=True)

@video_bp.route("/video/upload", methods=["POST"])
@jwt_required()

def upload_video():
    file = request.files.get("video")
    if not file:
        return jsonify({"error" : "No file found"}), 400
    
    video_id = f"{uuid.uuid4()}"
    original_path = os.path.join(UPLOAD_ORIGINAL, f"{video_id}.mp4")

    # 1. Create the video record in the DB with 'processing' status
    create_video(video_id)

    # 2. Save the original file
    file.save(original_path)

    # 3. Start transcoding in a background thread to avoid blocking the request
    app = current_app._get_current_object()
    thread = threading.Thread(target=transcode_with_context, args=(app, video_id))
    thread.start()

    # 4. Immediately return a 202 Accepted response
    return jsonify({
        "message": "Video upload accepted and is being processed.",
        "videoId" : video_id
    }), 202


def transcode_to_hls(video_id):
    # Use the global constants for paths
    input_path = os.path.join(UPLOAD_ORIGINAL, f"{video_id}.mp4")
    output_dir = os.path.join(UPLOAD_HLS, video_id)
    os.makedirs(output_dir, exist_ok=True)

    cmd = [
        "ffmpeg",
        "-i", input_path,
        "-filter_complex",
        "[0:v]split=3[v1][v2][v3];"
        "[v1]scale=1920:1080[v1out];"
        "[v2]scale=1280:720[v2out];"
        "[v3]scale=854:480[v3out]",
        "-map", "[v1out]", "-map", "0:a", "-b:v:0", "5000k",
        "-map", "[v2out]", "-map", "0:a", "-b:v:1", "2800k",
        "-map", "[v3out]", "-map", "0:a", "-b:v:2", "1400k",
        "-f", "hls",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-master_pl_name", "master.m3u8",
        f"{output_dir}/%v/stream.m3u8"
    ]

    # Run ffmpeg and capture output for logging
    process = subprocess.run(cmd, capture_output=True, text=True)
    if process.returncode == 0:
        print(f"Successfully transcoded video {video_id}")
        mark_ready(video_id)
    else:
        print(f"Failed to transcode video {video_id}. FFmpeg stderr:\n{process.stderr}")
        mark_failed(video_id)


def transcode_with_context(app, video_id):
    """
    A wrapper to run the transcoding function within the Flask app context,
    allowing it to access the database and other app services.
    """
    with app.app_context():
        transcode_to_hls(video_id)


@video_bp.route("/video/hls/<video_id>/<path:filename>")
def serve_hls(video_id, filename):
    directory = os.path.join(UPLOAD_HLS, video_id)
    response = send_from_directory(directory, filename)
    # Add CORS headers to allow the frontend to fetch video segments
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Range"
    response.headers["Access-Control-Expose-Headers"] = "Content-Length, Content-Range"
    return response


@video_bp.route("/stream/<video_id>")
def get_stream(video_id):
    """Returns the HLS master.m3u8 URL for a video"""
    return jsonify({
        "playlistUrl": f"/api/video/hls/{video_id}/master.m3u8"
    }), 200


@video_bp.route("/stream/upload")
def stream_upload():
    """Fallback endpoint - returns error as no video is selected"""
    return jsonify({
        "error": "No video selected. Please upload a video and select it from the room."
    }), 400
