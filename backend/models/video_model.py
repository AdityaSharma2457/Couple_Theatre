from extensions.db import mongo
from datetime import datetime

def create_video(video_id):
    mongo.db.videos.insert_one({
        "_id": video_id,
        "status": "PROCESSING",
        "createdAt": datetime.utcnow()
    })

def mark_ready(video_id):
    mongo.db.videos.update_one(
        {"_id": video_id},
        {"$set": {"status": "READY"}}
    )

def mark_failed(video_id, error=None):
    update = {
        "status": "FAILED",
        "failedAt": datetime.utcnow()
    }

    if error:
        update["error"] = error

    mongo.db.videos.update_one(
        {"_id": video_id},
        {"$set": update}
    )