
const roomIdd = localStorage.getItem("roomId");


const appId = "793a27f306ec4cb69c5a7b1f57b9c545"; // Replace with your App ID
const channelName = `collabboard-${roomIdd}`;


let client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localAudioTrack = null;

document.getElementById("joinVoiceBtn").onclick = async () => {
  await client.join(appId, channelName, null, null);
  localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([localAudioTrack]);

  // Update UI
  document.getElementById("joinVoiceBtn").style.display = "none";
  document.getElementById("muteVoiceBtn").style.display = "inline-block";
  document.getElementById("leaveVoiceBtn").style.display = "inline-block";
};

// Handle remote user joins
client.on("user-published", async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  if (mediaType === "audio") {
    const remoteAudioTrack = user.audioTrack;
    remoteAudioTrack.play();
  }
});

client.on("user-left", (user) => {
  console.log("User left the channel:", user.uid);
});

document.getElementById("muteVoiceBtn").onclick = () => {
  if (!localAudioTrack) return;
  const isMuted = localAudioTrack.muted;
  localAudioTrack.setMuted(!isMuted);
  document.getElementById("muteVoiceBtn").textContent = isMuted ? "🔇 Mute" : "🔊 Unmute";
};

document.getElementById("leaveVoiceBtn").onclick = async () => {
  if (localAudioTrack) {
    localAudioTrack.stop();
    localAudioTrack.close();
  }
  await client.leave();

  // Reset UI
  document.getElementById("joinVoiceBtn").style.display = "inline-block";
  document.getElementById("muteVoiceBtn").style.display = "none";
  document.getElementById("leaveVoiceBtn").style.display = "none";
};
