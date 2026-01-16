import eventlet
import os
import uuid
import subprocess

from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required
from models.video_model import create_video, mark_ready, mark_failed

video_bp = Blueprint("video", __name__)

# Base backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

UPLOAD_ORIGINAL = os.path.join(BACKEND_DIR, "uploads", "originals")
UPLOAD_HLS = os.path.join(BACKEND_DIR, "uploads", "hls")

os.makedirs(UPLOAD_ORIGINAL, exist_ok=True)
os.makedirs(UPLOAD_HLS, exist_ok=True)


# -------------------------
# VIDEO UPLOAD
# -------------------------
@video_bp.route("/video/upload", methods=["POST"])
@jwt_required()
def upload_video():
    file = request.files.get("video")
    if not file:
        return jsonify({"error": "No file found"}), 400

    video_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_ORIGINAL, f"{video_id}.mp4")

    # DB entry: processing
    create_video(video_id)

    # Save file (still batch upload – acceptable for college)
    file.save(input_path)

    # Start HLS generation in background
    app = current_app._get_current_object()
    eventlet.spawn_n(transcode_with_context, app, video_id)

    # IMPORTANT: return immediately
    return jsonify({
        "message": "Upload started, streaming will begin shortly",
        "videoId": video_id,
        "playlistUrl": f"/api/video/hls/{video_id}/stream.m3u8"
    }), 202


# -------------------------
# HLS TRANSCODING (FAST)
# -------------------------
def transcode_to_hls(video_id):
    input_path = os.path.join(UPLOAD_ORIGINAL, f"{video_id}.mp4")
    output_dir = os.path.join(UPLOAD_HLS, video_id)
    os.makedirs(output_dir, exist_ok=True)

    playlist_path = os.path.join(output_dir, "stream.m3u8")

    FFMPEG_PATH = os.getenv("FFMPEG_PATH", "ffmpeg")
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-i", input_path,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-g", "48",
        "-keyint_min", "48",
        "-sc_threshold", "0",
        "-c:a", "aac",
        "-b:a", "128k",
        "-hls_time", "2",
        "-hls_list_size", "0",
        "-hls_flags", "independent_segments",
        "-f", "hls",
        playlist_path
    ]

    process = subprocess.Popen(
        cmd,
        stdout=None,   # DO NOT PIPE
        stderr=None    # DO NOT PIPE
    )
    process.wait()
    if process.returncode == 0:
        mark_ready(video_id)
        print(f"[OK] HLS ready for {video_id}")
    else:
        mark_failed(video_id)
        print("[ERROR] FFmpeg failed")



def transcode_with_context(app, video_id):
    with app.app_context():
        transcode_to_hls(video_id)


# -------------------------
# SERVE HLS FILES
# -------------------------
@video_bp.route("/video/hls/<video_id>/<path:filename>")
def serve_hls(video_id, filename):
    directory = os.path.join(UPLOAD_HLS, video_id)
    response = send_from_directory(directory, filename)

    # Required for HLS.js
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Range"
    response.headers["Access-Control-Expose-Headers"] = "Content-Length, Content-Range"

    return response


# -------------------------
# GET STREAM URL
# -------------------------
@video_bp.route("/stream/<video_id>")
def get_stream(video_id):
    return jsonify({
        "playlistUrl": f"/api/video/hls/{video_id}/stream.m3u8"
    }), 200
