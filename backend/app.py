from flask import Flask
from routes.auth_routes import auth_bp
from routes.protected_route import protected_bp
from extensions.jwt import init_jwt
from extensions.db import init_db
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_jwt(app)
    init_db(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(protected_bp, url_prefix="/api")

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)