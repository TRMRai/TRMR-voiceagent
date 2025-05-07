//
// Copyright © 2025 Agora
// This file is part of TEN Framework, an open source project.
// Licensed under the Apache License, Version 2.0, with certain conditions.
// Refer to the "LICENSE" file in the root directory for more information.
//
import { useTranslation } from "react-i18next";
import AgoraRTC, { AgoraRTCProvider, LocalAudioTrack, LocalUser, LocalVideoTrack, RemoteUser, useIsConnected, useJoin, useLocalCameraTrack, useLocalMicrophoneTrack, usePublish, useRemoteUsers } from "agora-rtc-react";

import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils";
import { TEN_FRAMEWORK_URL, TEN_FRAMEWORK_GITHUB_URL } from "@/constants";
import { IWidget } from "@/types/widgets";
import { useEffect, useState } from "react";
import { RtcTokenBuilder } from "agora-token";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export const RTCWidgetTitle = () => {
  const { t } = useTranslation();
  return t("rtcInteraction.title");
}

const RTCWidgetContentInner = (_props: { widget: IWidget }) => {
  const { t } = useTranslation();


  const [ready, setReady] = useState(false);
  const isConnected = useIsConnected();
  const [appId, setAppId] = useState("");
  const [appCert, setAppCert] = useState("");
  const [channel, setChannel] = useState("test");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (appId && channel) {
      const token = RtcTokenBuilder.buildTokenWithUserAccount(
        appId,
        appCert,
        channel,
        0,
        1,
        Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
        Math.floor(Date.now() / 1000) + 3600  // 1 hour expiration
      );
      setToken(token);
      setReady(true);
    }
    return () => { }
  }, [appId, appCert, channel]);

  useJoin(
    { appid: appId, channel: channel, token: token ? token : null, uid: 1000 },
    ready
  );
  //local user
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  usePublish([localMicrophoneTrack, localCameraTrack]);
  //remote users
  const remoteUsers = useRemoteUsers();

  return (
    <div className="flex flex-col gap-2 h-full w-full">
      <LocalUser
        cameraOn={cameraOn}
        micOn={micOn}
        videoTrack={localCameraTrack}
        cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
      >
        <samp className="user-name">You</samp>
      </LocalUser>
      {remoteUsers.map((user) => (
        <div className="user" key={user.uid}>
          <RemoteUser cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg" user={user}>
            <samp className="user-name">{user.uid}</samp>
          </RemoteUser>
        </div>
      ))}
    </div>
  );
};

export const RTCWidgetContent = (props: { widget: IWidget }) => {
  const { widget } = props;

  return (
    <AgoraRTCProvider client={client}>
      <RTCWidgetContentInner widget={widget} />
    </AgoraRTCProvider>
  );
};