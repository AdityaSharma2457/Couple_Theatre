from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

protected_bp = Blueprint("protected", __name__)

@protected_bp.route("/me", methods = ["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    return jsonify({"message" : "Token is valid", "userId" : user_id}), 200
