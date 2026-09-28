import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

type UseVoiceChatProps = {
  roomId: string | null;
};

function useVoiceChat({ roomId }: UseVoiceChatProps) {
  const [isVoiceJoined, setIsVoiceJoined] =
    useState(false);

  const [isMuted, setIsMuted] =
    useState(false);

  const agoraClientRef =
    useRef<IAgoraRTCClient | null>(null);

  const localAudioTrackRef =
    useRef<IMicrophoneAudioTrack | null>(null);

  useEffect(() => {

    const client =
      AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

    agoraClientRef.current = client;

    const handleUserPublished = async (
      user: any,
      mediaType: "audio" | "video"
    ) => {
      try {
        await client.subscribe(
          user,
          mediaType
        );

        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      } catch (error) {
        console.error(
          "Failed to subscribe to remote voice:",
          error
        );
      }
    };

    const handleUserLeft = (user: any) => {
      console.log(
        "User left the voice channel:",
        user.uid
      );
    };

    client.on(
      "user-published",
      handleUserPublished
    );

    client.on(
      "user-left",
      handleUserLeft
    );

    return () => {
      client.off(
        "user-published",
        handleUserPublished
      );

      client.off(
        "user-left",
        handleUserLeft
      );

      const audioTrack =
        localAudioTrackRef.current;

      if (audioTrack) {
        audioTrack.stop();
        audioTrack.close();
        localAudioTrackRef.current = null;
      }

      if (
        client.connectionState !==
        "DISCONNECTED"
      ) {
        client.leave().catch((error) => {
          console.error(
            "Failed to leave voice channel:",
            error
          );
        });
      }

      agoraClientRef.current = null;
    };
  }, []);

  const handleJoinVoice = async () => {
    const client =
      agoraClientRef.current;

    if (!client || !roomId) {
      return;
    }

    try {
      const appId =
        "793a27f306ec4cb69c5a7b1f57b9c545";

      const channelName =
        `collabboard-${roomId}`;

      await client.join(
        appId,
        channelName,
        null,
        null
      );

      const audioTrack =
        await AgoraRTC.createMicrophoneAudioTrack();

      localAudioTrackRef.current =
        audioTrack;

      await client.publish([
        audioTrack,
      ]);

      setIsVoiceJoined(true);
      setIsMuted(false);
    } catch (error) {
      console.error(
        "Failed to join voice channel:",
        error
      );
    }
  };

  const handleMuteVoice = async () => {
    const audioTrack =
      localAudioTrackRef.current;

    if (!audioTrack) {
      return;
    }

    try {
      const newMutedState =
        !isMuted;

      await audioTrack.setMuted(
        newMutedState
      );

      setIsMuted(newMutedState);
    } catch (error) {
      console.error(
        "Failed to change microphone state:",
        error
      );
    }
  };

  const handleLeaveVoice = async () => {
    const audioTrack =
      localAudioTrackRef.current;

    const client =
      agoraClientRef.current;

    try {
      if (audioTrack) {
        audioTrack.stop();
        audioTrack.close();
        localAudioTrackRef.current =
          null;
      }

      if (
        client &&
        client.connectionState !==
          "DISCONNECTED"
      ) {
        await client.leave();
      }

      setIsVoiceJoined(false);
      setIsMuted(false);
    } catch (error) {
      console.error(
        "Failed to leave voice channel:",
        error
      );
    }
  };

  return {
    isVoiceJoined,
    isMuted,
    handleJoinVoice,
    handleMuteVoice,
    handleLeaveVoice,
  };
}

export default useVoiceChat;