import os
from flask import Blueprint, request, jsonify, Response, send_from_directory
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from bson.errors import InvalidId
from models.video_model import create_video, mark_ready, mark_failed
import uuid
import subprocess

video_bp = Blueprint("video", __name__)

# Video upload api
UPLOAD_ORIGINAL = "uploads/originals"
UPLOAD_HLS = "uploads/hls"

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
    file.save(original_path)

    transcode_to_hls(video_id)

    return jsonify({
        "videoId" : video_id
    }), 201


def transcode_to_hls(video_id):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ROOT_DIR = os.path.dirname(BASE_DIR) 

    input_path = os.path.join(
    ROOT_DIR, "uploads", "originals", f"{video_id}.mp4"
    )
    output_dir = os.path.join(
    ROOT_DIR, "uploads", "hls", video_id
    )
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

    process = subprocess.run(cmd)
    if process.returncode == 0:
        mark_ready(video_id)
    else:
        mark_failed(video_id)


@video_bp.route("/video/hls/<video_id>/<path:filename>")
def serve_hls(video_id, filename):
    directory = f"uploads/hls/{video_id}"
    return send_from_directory(directory, filename)
