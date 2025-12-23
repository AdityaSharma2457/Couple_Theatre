from extensions.db import mongo
from bson.objectid import ObjectId
from datetime import datetime

def save_message(room_code, sender_id, sender_name, message):
    msg = {
        "roomCode": room_code,
        "senderId": ObjectId(sender_id),
        "senderName": sender_name,
        "message": message,
        "timestamp": datetime.utcnow()
    }

    mongo.db.messages.insert_one(msg)
    return msg

def get_room_messages(room_code, limit=50):
    return list(
        mongo.db.messages
        .find({"roomCode": room_code})
        .sort("timestamp", 1)
        .limit(limit)
    )
