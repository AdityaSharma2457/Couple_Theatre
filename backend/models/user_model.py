from extensions.db import mongo
from bson import ObjectId
from datetime import datetime
import bcrypt

def create_user(username, email, password):
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    user = {
        "username": username,
        "email": email,
        "password": hashed,
        "createdAt": datetime.utcnow()
    }

    return mongo.db.users.insert_one(user)

def find_user_by_email(email):
    return mongo.db.users.find_one({"email": email})

def find_user_by_id(user_id):
    return mongo.db.users.find_one({"_id": ObjectId(user_id)})

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed)
