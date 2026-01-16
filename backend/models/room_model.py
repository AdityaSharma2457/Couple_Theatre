from extensions.db import mongo
from bson import ObjectId
from datetime import datetime
import random
import string

def generate_room_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_room(creator_id, video_url):
    room_code = generate_room_code()

    room = {
        "roomCode": room_code,
        "creatorId": ObjectId(creator_id),
        "partnerId": None,
        "videoUrl": video_url,
        "isPlaying": False,
        "currentTime": 0,
        "createdAt": datetime.utcnow(),
        "lastActivity": datetime.utcnow(),
        "isActive": True
    }

    mongo.db.rooms.insert_one(room)
    return room_code

def join_room(room_code, user_id):
    room = mongo.db.rooms.find_one({"roomCode": room_code, "isActive": True})

    if not room:
        return None

    if room["partnerId"] is not None:
        return "FULL"

    mongo.db.rooms.update_one(
        {"roomCode": room_code},
        {"$set": {"partnerId": ObjectId(user_id), "lastActivity": datetime.utcnow()}}
    )

    return "JOINED"

def get_room(room_code):
    return mongo.db.rooms.find_one(
        {"roomCode": room_code},
        {"_id": 0, "isPlaying": 1, "currentTime": 1}
    )

def attach_video(room_code, video_id):
    mongo.db.rooms.update_one(
        {"roomCode" : room_code},
        {"$set" : {"videoUrl" : video_id, "lastActivity": datetime.utcnow()}}
    )


def get_room_with_video(room_code):
    """Get full room data including video URL"""
    return mongo.db.rooms.find_one(
        {"roomCode": room_code},
        {"_id": 0}
    )

def update_playback(room_code, is_playing, current_time):
    mongo.db.rooms.update_one(
        {"roomCode": room_code},
        {"$set": {
            "isPlaying": is_playing,
            "currentTime": current_time,
            "lastActivity": datetime.utcnow()
        }}
    )

def get_playback_state(room_code):
    room = mongo.db.rooms.find_one(
        {"roomCode": room_code},
        {"_id": 0, "isPlaying": 1, "currentTime": 1}
    )
    return room


def serialize_room(room):
    if not room:
        return None

    clean = {}
    for key, value in room.items():
        if isinstance(value, ObjectId):
            clean[key] = str(value)
        elif isinstance(value, datetime):
            clean[key] = value.isoformat()
        else:
            clean[key] = value

    return clean
