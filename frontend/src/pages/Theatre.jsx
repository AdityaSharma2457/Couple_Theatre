import React, { useEffect, useRef, useState } from "react";
import Popup from "../components/Popup";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";
import Hls from "hls.js";
import "./Theatre.css";

const SOCKET_URL = "https://couple-theatre.onrender.com;

const Theatre = () => {
  const [roomkeypopup, setRoomKeyPopup] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [callType, setCallType] = useState(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomId = params.get("code");

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const myVideoRef = useRef(null);
  const partnerVideoRef = useRef(null);
  const peerRef = useRef(null);

  /* =========================
     FETCH ROOM DATA
     ========================= */
  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://couple-theatre.onrender.com/api/room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const room = await res.json();

      // 🔥 IMPORTANT:
      // Do NOT poll. Do NOT check readiness.
      // Attach HLS immediately.
      if (room.videoUrl) {
        setVideoUrl(
          `https://couple-theatre.onrender.com/api/video/hls/${room.videoUrl}/stream.m3u8`
        );
      }
    };

    fetchRoom();
  }, [roomId]);

  /* =========================
     HLS PLAYER SETUP
     ========================= */
  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.currentTime = 0;
        video.play().catch(() => { });
      });

      return () => hls.destroy();
    }

    // Safari fallback
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.play().catch(() => { });
    }
  }, [videoUrl]);

  /* =========================
     SOCKET.IO SETUP
     ========================= */
  useEffect(() => {
    if (!roomId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { roomId });
    });

    socket.on("sync_video", ({ action, time }) => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = time;
      if (action === "play") video.play();
      if (action === "pause") video.pause();
    });

    return () => socket.disconnect();
  }, [roomId]);

  const emitVideoEvent = (action) => {
    if (!socketRef.current || !videoRef.current) return;

    socketRef.current.emit("video_event", {
      roomId,
      action,
      time: videoRef.current.currentTime,
    });
  };

  /* =========================
     WEBRTC (UNCHANGED LOGIC)
     ========================= */
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("ice_candidate", {
          roomId,
          candidate: e.candidate,
        });
      }
    };

    peer.ontrack = (e) => {
      partnerVideoRef.current.srcObject = e.streams[0];
    };

    peerRef.current = peer;
    return peer;
  };

  const startCall = async (type) => {
    setCallType(type);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    myVideoRef.current.srcObject = stream;

    const peer = createPeer();
    stream.getTracks().forEach((t) => peer.addTrack(t, stream));

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socketRef.current.emit("offer", { roomId, offer, type });
  };

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    s.on("offer", async ({ offer, type }) => {
      setCallType(type);

      const peer = createPeer();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });

      myVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((t) => peer.addTrack(t, stream));

      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      s.emit("answer", { roomId, answer });
    });

    s.on("answer", async ({ answer }) => {
      await peerRef.current.setRemoteDescription(answer);
    });

    s.on("ice_candidate", (c) => peerRef.current?.addIceCandidate(c));

    return () => {
      s.off("offer");
      s.off("answer");
      s.off("ice_candidate");
    };
  }, []);

  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    setCallType(null);

    myVideoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    myVideoRef.current.srcObject = null;
    partnerVideoRef.current.srcObject = null;

    socketRef.current.emit("end_call", { roomId });
  };

  /* =========================
     UI
     ========================= */
  return (
    <div>
      {roomkeypopup && (
        <Popup
          cover={"✅ room Code"}
          message={roomId}
          onclose={() => setRoomKeyPopup(false)}
        />
      )}

      <div className="theatre">
        <div className="theatre-layout">

          {/* LEFT SIDE - Movie */}
          <div className="theatre-left">
            <video
              ref={videoRef}
              className="main-video"
              controls
              onPlay={() => emitVideoEvent("play")}
              onPause={() => emitVideoEvent("pause")}
              onSeeked={() => emitVideoEvent("seek")}
            />
          </div>

          {/* RIGHT SIDE - Calls */}
          <div className="theatre-right">
            <div className="calls">
              <video
                className="call-video"
                ref={myVideoRef}
                autoPlay
                muted
                playsInline
              />
              <video
                className="call-video"
                ref={partnerVideoRef}
                autoPlay
                playsInline
              />

              {!callType && (
                <div className="btn-box">
                  <button onClick={() => startCall("voice")}>🎙 Voice Call</button>
                  <button onClick={() => startCall("video")}>🎥 Video Call</button>
                </div>
              )}

              {callType && (
                <button className="end-btn" onClick={endCall}>
                  ❌ End Call
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>

  );
};

export default Theatre;
