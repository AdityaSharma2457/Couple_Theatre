from datetime import datetime, timedelta
from extensions.db import mongo
import shutil
import os

def cleanup_rooms():
    now = datetime.utcnow()

    expired_rooms = mongo.db.rooms.find({
        "lastActivity" : {"$lt" : now - timedelta(minutes=30)},
        "isActive" : True
    })

    for room in expired_rooms:
        mongo.db.rooms.update_one(
            {"_id" : room["_id"]},
            {"$set" : {"isActive" : False}}    
        )
    
    dead_rooms = mongo.db.rooms.find({
        "lastActivity" : {"$lt" : now - timedelta(hours=24)},
        "isActive" : False
    })

    for room in dead_rooms:
        video_id = room.get("videoUrl")
        if video_id:
            shutil.rmtree(f"uploads/hls/{video_id}", ignore_errors=True)
            os.remove(f"uploads/originals/{video_id}.mp4")
        
        mongo.db.rooms.delete_one({"_id" : room["_id"]})