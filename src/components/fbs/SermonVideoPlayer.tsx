import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Play, Clock, Music } from "lucide-react";

export interface SermonVideoPlayerHandle {
  seekTo: (seconds: number) => void;
}

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".wma"];

function isAudioUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().split("?")[0];
  return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

interface SermonVideoPlayerProps {
  videoUrl?: string | null;
  sourceUrl?: string | null;
  sourceType: "upload" | "youtube" | "vimeo";
  thumbnailUrl?: string | null;
  storagePath?: string | null;
  duration?: string | null;
  mediaType?: string | null;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
}

const SermonVideoPlayer = forwardRef<SermonVideoPlayerHandle, SermonVideoPlayerProps>(
  ({ videoUrl, sourceUrl, sourceType, thumbnailUrl, storagePath, duration, mediaType }, ref) => {
    const [playing, setPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const playableUrl = videoUrl || sourceUrl;
    const youtubeId = sourceType === "youtube" && playableUrl ? extractYouTubeId(playableUrl) : null;

    // Detect audio: check mediaType prop, then fallback to file extension
    const isAudio =
      mediaType?.startsWith("audio/") ||
      isAudioUrl(storagePath) ||
      isAudioUrl(playableUrl);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = seconds;
          if (audioRef.current.paused) audioRef.current.play();
        } else if (videoRef.current) {
          videoRef.current.currentTime = seconds;
          if (videoRef.current.paused) videoRef.current.play();
          setPlaying(true);
        } else if (youtubeId && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
            "*"
          );
          setPlaying(true);
        }
      },
    }));

    // Audio player
    if (isAudio && (playableUrl || storagePath)) {
      const src = playableUrl || "";
      return (
        <div className="relative rounded-3xl overflow-hidden">
          <div
            className="w-full flex flex-col items-center justify-center px-6 py-10"
            style={{
              background: "linear-gradient(135deg, hsl(207, 55%, 35%) 0%, hsl(220, 50%, 25%) 100%)",
            }}
          >
            {/* Cross watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none">
              <div style={{ width: 60, height: 4, background: "white", position: "absolute" }} />
              <div style={{ width: 4, height: 80, background: "white", position: "absolute" }} />
            </div>

            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 z-10">
              <Music size={24} className="text-white" />
            </div>

            {duration && (
              <p className="text-white/50 text-xs mb-4 z-10 flex items-center gap-1">
                <Clock size={11} />
                {duration}
              </p>
            )}

            <audio
              ref={audioRef}
              src={src}
              controls
              className="w-full z-10 rounded-lg"
              style={{ maxWidth: "100%" }}
            />
          </div>
        </div>
      );
    }

    // YouTube embed
    if (youtubeId) {
      if (!playing) {
        const ytThumb = thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
        return (
          <div
            className="relative rounded-3xl overflow-hidden tap-active cursor-pointer"
            onClick={() => setPlaying(true)}
          >
            <div className="w-full aspect-video relative">
              <img src={ytThumb} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Play size={24} className="text-white fill-white ml-1" />
                </div>
                <p className="text-white/80 text-xs font-medium">Tap to watch</p>
                {duration && (
                  <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                    <Clock size={11} />
                    {duration}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="rounded-3xl overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1`}
            className="w-full aspect-video"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      );
    }

    // Direct video (uploaded file)
    if (playableUrl || storagePath) {
      if (!playing) {
        return (
          <div
            className="relative rounded-3xl overflow-hidden tap-active cursor-pointer"
            onClick={() => setPlaying(true)}
          >
            <div className="w-full aspect-video relative">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(207, 55%, 35%) 0%, hsl(220, 50%, 25%) 100%)",
                  }}
                />
              )}
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Play size={24} className="text-white fill-white ml-1" />
                </div>
                <p className="text-white/80 text-xs font-medium">Tap to watch</p>
                {duration && (
                  <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                    <Clock size={11} />
                    {duration}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }

      const src = playableUrl || "";
      return (
        <div className="rounded-3xl overflow-hidden">
          <video
            ref={videoRef}
            src={src}
            poster={thumbnailUrl || undefined}
            controls
            autoPlay
            className="w-full aspect-video bg-black"
          />
        </div>
      );
    }

    // Fallback: no video available
    return (
      <div className="relative rounded-3xl overflow-hidden">
        <div
          className="w-full aspect-video flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(135deg, hsl(207, 55%, 35%) 0%, hsl(220, 50%, 25%) 100%)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div style={{ width: 60, height: 4, background: "white", position: "absolute" }} />
            <div style={{ width: 4, height: 80, background: "white", position: "absolute" }} />
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 z-10">
            <Play size={24} className="text-white fill-white ml-1" />
          </div>
          <p className="text-white/80 text-xs font-medium z-10">Video coming soon</p>
          {duration && (
            <p className="text-white/50 text-xs mt-1 z-10 flex items-center gap-1">
              <Clock size={11} />
              {duration}
            </p>
          )}
        </div>
      </div>
    );
  }
);

SermonVideoPlayer.displayName = "SermonVideoPlayer";
export default SermonVideoPlayer;
