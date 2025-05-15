"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TrulienceAvatar } from "trulience-sdk";
import { IRemoteAudioTrack } from "agora-rtc-react";
import { Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { useAppStore } from "@/store";

interface AvatarProps {
  audioTrack?: IRemoteAudioTrack | null;
}

export default function Avatar({ audioTrack }: AvatarProps) {
  const { preferences } = useAppStore();
  const trulienceSettings = preferences.trulience;
  const trulienceAvatarRef = useRef<TrulienceAvatar>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Track loading progress
  const [loadProgress, setLoadProgress] = useState(0);

  // State for the final avatar ID
  const [finalAvatarId, setFinalAvatarId] = useState("");

  // State for toggling fullscreen
  const [fullscreen, setFullscreen] = useState(false);

  // Safely read URL param on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const avatarIdFromURL = urlParams.get("avatarId");
      setFinalAvatarId(
        avatarIdFromURL || trulienceSettings.trulienceAvatarId || ""
      );
    }
  }, [trulienceSettings.trulienceAvatarId]);

  // Define event callbacks
  const eventCallbacks = useMemo(() => {
    return {
      "auth-success": (resp: string) => {
        console.log("Trulience Avatar auth-success:", resp);
      },
      "auth-fail": (resp: {message:string}) => {
        console.log("Trulience Avatar auth-fail:", resp);
        setErrorMessage(resp.message);
      },
      "websocket-connect": (resp: string) => {
        console.log("Trulience Avatar websocket-connect:", resp);
      },
      "load-progress": (details: {progress:number}) => {
        console.log("Trulience Avatar load-progress:", details.progress);
        setLoadProgress(details.progress);
      },
    };
  }, []);

  // Only create TrulienceAvatar instance once we have a final avatar ID
  const trulienceAvatarInstance = useMemo(() => {
    if (!finalAvatarId) return null;
    return (
      <TrulienceAvatar
        url={trulienceSettings.trulienceSdkUrl}
        ref={trulienceAvatarRef}
        avatarId={finalAvatarId}
        token={trulienceSettings.trulienceAvatarToken}
        eventCallbacks={eventCallbacks}
        width="100%"
        height="100%"
      />
    );
  }, [
    finalAvatarId,
    trulienceSettings.trulienceSdkUrl,
    trulienceSettings.trulienceAvatarToken,
    eventCallbacks
  ]);

  // Update the Avatar’s audio stream whenever audioTrack 
  // or agentConnected changes
  useEffect(() => {
    const avatarRefCurrent = trulienceAvatarRef.current;
    if (avatarRefCurrent) {
      if (audioTrack) {
        const stream = new MediaStream([audioTrack.getMediaStreamTrack()]);
        avatarRefCurrent.setMediaStream(null);
        avatarRefCurrent.setMediaStream(stream);
        console.warn("[TrulienceAvatar] MediaStream set:", stream);
      }
    }

    // Cleanup: unset media stream
    return () => {
      avatarRefCurrent?.setMediaStream(null);
    };
  }, [audioTrack]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-lg", {
      ["absolute top-0 left-0 h-screen w-screen rounded-none"]: fullscreen
    })}>
      <button
        className={cn(
          "absolute z-10 top-2 right-2",
          "bg-black/50 p-2 rounded-lg",
          "hover:bg-black/70 transition"
        )}
        onClick={() => setFullscreen(prevValue => !prevValue)}
      >
        {fullscreen ? (
          <Minimize className="text-white" size={24} />
        ) : (
          <Maximize className="text-white" size={24} />
        )}
      </button>

      {/* Render the TrulienceAvatar */}
      {trulienceAvatarInstance}

      {/* Show a loader overlay while progress < 1 */}
      {errorMessage ? (
        <div
          className="
            absolute inset-0 z-10 
            flex items-center justify-center 
            bg-red-500 bg-opacity-80 
            text-white"
        >
          <div>{errorMessage}</div>
        </div>
      ) : loadProgress < 1 && (
        <div
          className="
            absolute inset-0 z-10 
            flex items-center justify-center 
            bg-black bg-opacity-80"
        >
          {/* Simple Tailwind spinner */}
          <Progress
            className="
              relative 
              h-[15px] 
              w-[200px] 
              overflow-hidden 
              rounded-full 
              bg-blackA6"
            style={{
              // Fix overflow clipping in Safari
              // https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0
              transform: "translateZ(0)",
            }}
            value={loadProgress*100}
          >
            <ProgressIndicator
              className="
                ease-[cubic-bezier(0.65, 0, 0.35, 1)] 
                size-full 
                bg-white 
                transition-transform 
                duration-[660ms]"
              style={{ transform: `translateX(-${100 - loadProgress*100}%)` }}
            />
          </Progress>
        </div>
      )}
    </div>
  );
}
