from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from extensions.jwt import init_jwt
from extensions.db import init_db
from extensions.socket import socketio
from config import Config

from routes.auth_routes import auth_bp
from routes.protected_route import protected_bp
from routes.room_routes import room_bp
from routes.video_routes import video_bp

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True)

    init_jwt(app)
    init_db(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(protected_bp, url_prefix="/api")
    app.register_blueprint(room_bp, url_prefix="/api")
    app.register_blueprint(video_bp, url_prefix="/api")

    return app


# 🔴 THESE TWO LINES ARE CRITICAL
app = create_app()
socketio.init_app(app, cors_allowed_origins="*")


# 🔴 LOCAL DEV ONLY
if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False
    )
