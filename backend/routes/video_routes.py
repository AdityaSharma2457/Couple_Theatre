import os
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from bson.errors import InvalidId
import uuid

video_bp = Blueprint("video", __name__)

# Video upload api
UPLOAD_FOLDER = "uploads/videos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@video_bp.route("/video/upload", methods=["POST"])
@jwt_required()

def upload_video():
    file = request.files.get("video")
    if not file:
        return jsonify({"error" : "No file found"}), 400
    
    file_name = secure_filename(file.filename)
    video_id = f"{uuid.uuid4()}.mp4"

    file_path = os.path.join(UPLOAD_FOLDER, video_id)
    file.save(file_path)

    return jsonify({
        "videoId" : video_id
    }), 201


# Video streamin api
CHUNK_SIZE = 1024 * 1024

@video_bp.route("/video/stream/<video_id>")

def stream_video(video_id):
    path = os.path.join(UPLOAD_FOLDER, video_id)
    if not os.path.exists(path):
        return jsonify({"error" : "Video not found"}), 400
    
    file_size = os.path.getsize(path)
    range_header = request.headers.get("Range")

    start, end = 0, file_size - 1

    if range_header:
        start = int(range_header.replace("bytes=", "").split('-')[0])
        end = min(start + CHUNK_SIZE, file_size - 1)
    
    def generate():
        with open(path, "rb") as f:
            f.seek(start)
            yield f.read(end - start + 1)
    
    headers = { "Content-Range" : f"bytes {start} - {end} / {file_size}",
        "Accept-Ranges" : "bytes",
        "Content-Length" : str(start - end + 1),
        "Content-Type" : "video/mp4" }
    
    return Response(generate(), status=206, headers=headers)