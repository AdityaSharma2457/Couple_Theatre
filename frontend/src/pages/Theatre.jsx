import React, { useEffect, useRef, useState } from "react";
import Popup from "../components/Popup";
import { useLocation } from "react-router-dom";
import {io} from "socket.io-client";
// import "./Theatre.css";
const SOCKET_URL = "http://localhost:5000"; // change in production

const Theatre = () => {
  const [roomkeypopup, setroomkeypopup] = useState(false);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const code = params.get("code");

  const roomId = code; // ✅ use code as roomId

  // ✅ refs
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const myVideoRef = useRef(null);
  const partnerVideoRef = useRef(null);
  const peerRef = useRef(null);

  const [callType, setCallType] = useState(null); // "voice" | "video"

  // =========================
  // Popup on mount
  // =========================
  useEffect(() => {
    setroomkeypopup(true);
  }, []);

  // =========================
  // SOCKET CONNECT + JOIN ROOM
  // =========================
  useEffect(() => {
    if (!roomId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("join_room", { roomId });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const socket = socketRef.current;

  // =========================
  // VIDEO SYNC (WebSocket)
  // =========================
  useEffect(() => {
    if (!socketRef.current) return;

    const s = socketRef.current;

    s.on("sync_video", ({ action, time }) => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = time;

      if (action === "play") video.play();
      if (action === "pause") video.pause();
    });

    return () => s.off("sync_video");
  }, []);

  const emitVideoEvent = (action) => {
    if (!socketRef.current || !videoRef.current) return;

    socketRef.current.emit("video_event", {
      roomId,
      action,
      time: videoRef.current.currentTime,
    });
  };

  // =========================
  // WEBRTC – PEER SETUP
  // =========================
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("ice_candidate", {
          roomId,
          candidate: e.candidate,
        });
      }
    };

    peer.ontrack = (e) => {
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = e.streams[0];
      }
    };

    peerRef.current = peer;
    return peer;
  };

  // =========================
  // START CALL
  // =========================
  const startCall = async (type) => {
    if (!socketRef.current) return;

    setCallType(type);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    if (myVideoRef.current) myVideoRef.current.srcObject = stream;

    const peer = createPeer();
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socketRef.current.emit("offer", { roomId, offer, type }); // ✅ include type
  };

  // =========================
  // SOCKET SIGNALING
  // =========================
  useEffect(() => {
    if (!socketRef.current) return;

    const s = socketRef.current;

    s.on("offer", async ({ offer, type }) => {
      const peer = createPeer();

      setCallType(type || "video");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });

      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(offer);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      s.emit("answer", { roomId, answer });
    });

    s.on("answer", async ({ answer }) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(answer);
    });

    s.on("ice_candidate", async ({ candidate }) => {
      try {
        await peerRef.current?.addIceCandidate(candidate);
      } catch (err) {
        console.log("ICE error:", err);
      }
    });

    // ✅ end call from other user (do not re-emit!)
    s.on("end_call", () => endCall(false));

    return () => {
      s.off("offer");
      s.off("answer");
      s.off("ice_candidate");
      s.off("end_call");
    };
  }, []);

  // =========================
  // END CALL
  // =========================
  const endCall = (emit = true) => {
    peerRef.current?.close();
    peerRef.current = null;
    setCallType(null);

    if (myVideoRef.current?.srcObject) {
      myVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      myVideoRef.current.srcObject = null;
    }

    if (partnerVideoRef.current?.srcObject) {
      partnerVideoRef.current.srcObject = null;
    }

    if (emit && socketRef.current) {
      socketRef.current.emit("end_call", { roomId });
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="theatre">
      <div>
        {roomkeypopup && (
          <Popup
            cover={"✅ room Code"}
            message={code}
            onclose={() => setroomkeypopup(false)}
          />
        )}
      </div>

      {/* 🎬 Main Video */}
      <video
        ref={videoRef}
        controls
        onPlay={() => emitVideoEvent("play")}
        onPause={() => emitVideoEvent("pause")}
        onSeeked={() => emitVideoEvent("seek")}
      >
        <source src={`/api/video/hls/${roomId}/master.m3u8`} type="application/x-mpegURL" />
      </video>

      {/* 📞 Call Section */}
      <div className="calls">
        <video ref={myVideoRef} autoPlay muted playsInline />
        <video ref={partnerVideoRef} autoPlay playsInline />

        {!callType && (
          <>
            <button onClick={() => startCall("voice")}>🎙 Voice Call</button>
            <button onClick={() => startCall("video")}>🎥 Video Call</button>
          </>
        )}

        {callType && <button onClick={() => endCall(true)}>❌ End Call</button>}
      </div>
    </div>
  );
};

export default Theatre;
