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
    return mongo.db.rooms.find_one({"roomCode": room_code})

# def update_playback(room_code, is_playing, current_time):
#     mongo.db.rooms.update_one(
#         {"roomCode": room_code},
#         {"$set": {
#             "isPlaying": is_playing,
#             "currentTime": current_time,
#             "lastActivity": datetime.utcnow()
#         }}
#     )