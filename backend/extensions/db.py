import os
from flask_pymongo import PyMongo

mongo = PyMongo()

def init_db(app):
    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    print("USING MONGO URI:", app.config["MONGO_URI"])
    mongo.init_app(app)
