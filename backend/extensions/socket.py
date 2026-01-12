from flask_socketio import SocketIO, join_room, leave_room

# Single global socket instance
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="eventlet",   # or "gevent" / "threading"
    ping_timeout=60,
    ping_interval=25
)
