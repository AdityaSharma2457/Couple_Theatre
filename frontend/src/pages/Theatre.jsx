import React, { useEffect, useRef, useState } from "react";
import Popup from "../components/Popup";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";
import "./Theatre.css";
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
  const [videoUrl, setVideoUrl] = useState(null); // video URL from room

  // =========================
  // Fetch Room Data on Mount
  // =========================
  useEffect(() => {
    if (!roomId) return;
    
    const fetchRoomData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        console.log("Fetching room:", roomId);
        const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        console.log("Room fetch response:", res.status);
        if (res.ok) {
          const room = await res.json();
          console.log("Room data:", room);
          if (room.videoUrl) {
            // Check if video is ready by fetching the master.m3u8
            const videoId = room.videoUrl;
            const videoUrl = `http://localhost:5000/api/video/hls/${videoId}/master.m3u8`;
            
            // Poll to check if video is ready
            const checkVideoReady = async () => {
              try {
                const videoRes = await fetch(videoUrl);
                if (videoRes.ok) {
                  console.log("Setting video URL:", videoUrl);
                  setVideoUrl(videoUrl);
                } else {
                  console.log("Video not ready yet (HLS files still transcoding), retrying in 2s...");
                  setTimeout(checkVideoReady, 2000);
                }
              } catch (err) {
                console.log("Video not ready yet, retrying in 2s...");
                setTimeout(checkVideoReady, 2000);
              }
            };
            
            checkVideoReady();
          } else {
            console.log("No videoUrl in room data");
          }
        } else {
          console.error("Room fetch failed:", res.status);
        }
      } catch (err) {
        console.error("Error fetching room data:", err);
      }
    };
    
    fetchRoomData();
  }, [roomId]);

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
  <div>
    {roomkeypopup && (
      <Popup
        cover={"✅ room Code"}
        message={code}
        onclose={() => setroomkeypopup(false)}
      />
    )}
    <div className="theatre">
    <div className="theatre-layout">

      {/* LEFT SIDE - Movie */}
      <div className="theatre-left">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="main-video"
            src={videoUrl}
            controls
            onPlay={() => emitVideoEvent("play")}
            onPause={() => emitVideoEvent("pause")}
            onSeeked={() => emitVideoEvent("seek")}
          />
        ) : (
          <div className="no-video">
            <p>Loading video... This may take a moment while we process your video.</p>
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Calls */}
      <div className="theatre-right">
        <div className="calls">
          <video className="call-video" ref={myVideoRef} autoPlay muted playsInline />
          <video className="call-video" ref={partnerVideoRef} autoPlay playsInline />

          {!callType && (
            <div className="btn-box">
              <button onClick={() => startCall("voice")}>🎙 Voice Call</button>
              <button onClick={() => startCall("video")}>🎥 Video Call</button>
            </div>
          )}

          {callType && (
            <button className="end-btn" onClick={() => endCall(true)}>
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