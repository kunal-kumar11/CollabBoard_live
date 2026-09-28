type VoiceControlsProps = {
  isVoiceJoined: boolean;
  isMuted: boolean;

  onJoin: () => void;
  onMute: () => void;
  onLeave: () => void;
};

function VoiceControls({
  isVoiceJoined,
  isMuted,
  onJoin,
  onMute,
  onLeave,
}: VoiceControlsProps) {
  return (
    <div id="voiceControls">
      {!isVoiceJoined && (
        <button
          id="joinVoiceBtn"
          onClick={onJoin}
        >
          🔊 Join Call
        </button>
      )}

      {isVoiceJoined && (
        <>
          <button
            id="muteVoiceBtn"
            onClick={onMute}
          >
            {isMuted ? "🔊 Unmute" : "🔇 Mute"}
          </button>

          <button
            id="leaveVoiceBtn"
            onClick={onLeave}
          >
            ❌ Leave
          </button>
        </>
      )}
    </div>
  );
}

export default VoiceControls;