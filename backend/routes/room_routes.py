from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.room_model import create_room, join_room, get_room
from bson import ObjectId

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









@room_bp.route("/room/debug/join", methods=["POST"])
def debug_join_room():
    data = request.get_json()
    room_code = data.get("roomCode")
    fake_user_id = ObjectId(data.get("userId"))
    result = join_room(room_code, fake_user_id)

    return jsonify({"result": result})
