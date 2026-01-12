from flask_socketio import join_room, emit
from extensions.socket import socketio
from models.room_model import update_playback, get_room


# JOIN ROOM

@socketio.on("join_room")
def handle_join_room(data):
    room_id = data.get("roomId")
    if not room_id:
        return

    join_room(room_id)

    # Sync state for late joiners
    room = get_room(room_id)
    if not room:
        return

    emit(
        "sync_video",
        {
            "action": "play" if room.get("isPlaying") else "pause",
            "time": room.get("currentTime", 0)
        },
        room=room_id
    )

# VIDEO EVENTS (PLAY / PAUSE / SEEK)

@socketio.on("video_event")
def handle_video_event(data):
    room_id = data.get("roomId")
    action = data.get("action")
    time = data.get("time")

    if not room_id or action not in ["play", "pause", "seek"]:
        return

    # Update DB state
    if action == "play":
        update_playback(room_id, True, time)
    elif action == "pause":
        update_playback(room_id, False, time)
    elif action == "seek":
        update_playback(room_id, None, time)

    # Broadcast to everyone in room
    emit(
        "sync_video",
        {
            "action": action,
            "time": time
        },
        room=room_id,
        include_self=False  # ❗ Host already acted locally
    )
