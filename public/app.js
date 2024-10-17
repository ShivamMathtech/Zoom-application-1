const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let remoteStream;
let peerConnection;

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function startVideoConference() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = localStream;

  socket.on("offer", async (data) => {
    peerConnection = createPeerConnection();
    peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
  });

  socket.on("answer", (data) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data));
  });

  socket.on("candidate", (data) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data));
  });

  createPeerConnection();
}

function createPeerConnection() {
  const pc = new RTCPeerConnection(configuration);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
      remoteVideo.srcObject = remoteStream;
    }
    remoteStream.addTrack(event.track);
  };

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  return pc;
}

startVideoConference();
