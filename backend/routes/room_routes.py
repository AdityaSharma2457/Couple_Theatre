from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.room_model import create_room, join_room, get_room, attach_video, serialize_room, get_room_with_video
from bson import ObjectId
from extensions.db import mongo

room_bp = Blueprint("room", __name__)

@room_bp.route("/room/create", methods=["POST"])
@jwt_required()

def create_room_api():
    user_id = get_jwt_identity()

    room_code = create_room(creator_id=user_id, video_url=None)

    return jsonify({
        "roomCode": room_code
    }), 201


@room_bp.route("/room/join", methods=["POST"])
@jwt_required()

def join_room_api():
    user_id = get_jwt_identity()
    data = request.get_json()

    room_code = data.get("roomCode")

    if not room_code:
        return jsonify({"error": "Room code required"}), 400

    result = join_room(room_code, user_id)

    if result is None:
        return jsonify({"error": "Room not found"}), 404

    if result == "FULL":
        return jsonify({"error": "Room already full"}), 403

    return jsonify({
        "message": "Joined room",
        "roomCode": room_code
    }), 200


@room_bp.route("/room/<room_code>/video", methods=["POST"])
@jwt_required()
def attach_video_api(room_code):
    data = request.get_json()
    video_id = data.get("videoId")
    
    if not video_id:
        return jsonify({"error": "videoId is required"}), 400
    
    # Check if room exists first
    room = mongo.db.rooms.find_one({"roomCode": room_code})
    if not room:
        print(f"❌ Room not found: {room_code}")
        return jsonify({"error": f"Room {room_code} not found"}), 404
    
    print(f"✅ Attaching video {video_id} to room {room_code}")
    attach_video(room_code, video_id)
    
    # Verify it was attached
    updated_room = mongo.db.rooms.find_one({"roomCode": room_code})
    print(f"✅ Room updated. videoUrl is now: {updated_room.get('videoUrl')}")
    
    return jsonify({"message": "Video attached", "videoUrl": updated_room.get('videoUrl')}), 200


@room_bp.route("/room/<room_code>", methods=["GET"])
@jwt_required()
def get_room_api(room_code):
    room = get_room_with_video(room_code)
    if not room:
        return jsonify({"error": "Room not found"}), 404

    return jsonify(serialize_room(room)), 200