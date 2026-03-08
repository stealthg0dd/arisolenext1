import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

export type PendingVideo = {
  uri: string;
  caption: string;
};

type PendingVideoContextShape = {
  pendingVideo: PendingVideo | null;
  setPendingVideo: (v: PendingVideo | null) => void;
  clearPendingVideo: () => void;
};

const PendingVideoContext = createContext<PendingVideoContextShape>({
  pendingVideo: null,
  setPendingVideo: () => {},
  clearPendingVideo: () => {}
});

export function PendingVideoProvider({ children }: PropsWithChildren) {
  const [pendingVideo, setPendingVideo] = useState<PendingVideo | null>(null);
  const value = useMemo(
    () => ({
      pendingVideo,
      setPendingVideo,
      clearPendingVideo: () => setPendingVideo(null)
    }),
    [pendingVideo]
  );
  return (
    <PendingVideoContext.Provider value={value}>{children}</PendingVideoContext.Provider>
  );
}

export function usePendingVideo() {
  return useContext(PendingVideoContext);
}
