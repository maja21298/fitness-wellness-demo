import YouTube from "react-youtube";
import { useMusic } from "../../contexts/MusicContext";
import { useTranslation } from "../../i18n/useTranslation";
import {
  HiPlayCircle,
  HiPauseCircle,
  HiXMark,
  HiMusicalNote,
  HiChevronUp,
  HiChevronDown,
  HiForward,
  HiBackward,
} from "react-icons/hi2";

export default function MiniPlayer() {
  const { t } = useTranslation();
  const {
    currentVideo, isPlaying, isMinimized, togglePlay, stop, minimize, expand, playerRef,
    activeEmbed, embedVisible, toggleEmbedVisible, closeEmbed, streamingEmbeds,
    localPlaying, localPaused, toggleLocalPause, stopLocal, playNextLocal, playPrevLocal,
    audioRef, activeSource,
  } = useMusic();

  const handleReady = (e) => { playerRef.current = e.target; };

  const embedData = activeEmbed ? streamingEmbeds.find((e) => e.id === activeEmbed) : null;
  const hasAnything = currentVideo || activeEmbed || localPlaying;

  const serviceIcon = embedData?.service === "spotify"
    ? "SP"
    : embedData?.service === "apple"
      ? "AM"
      : embedData?.service === "deezer"
        ? "DZ"
        : "MU";

  return (
    <>
      {/* Persistent hidden YouTube player */}
      {currentVideo && (
        <div className="fixed" style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none", overflow: "hidden", left: -9999, top: -9999 }}>
          <YouTube
            videoId={currentVideo.videoId}
            opts={{ width: "1", height: "1", playerVars: { autoplay: 1, controls: 0 } }}
            onReady={handleReady}
          />
        </div>
      )}

      {/* Persistent audio element for local files */}
      <audio ref={audioRef} onEnded={playNextLocal} className="hidden" />

      {/* Persistent streaming embed iframe */}
      {embedData && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            embedVisible
              ? "bottom-(--layout-mobile-nav-h) md:bottom-0 left-0 md:left-(--layout-sidebar-w) right-0"
              : "bottom-[-600px]"
          }`}
          style={{ pointerEvents: embedVisible ? "auto" : "none" }}
        >
          <div className="max-w-2xl mx-auto px-2">
            <div className="bg-white rounded-t-2xl border border-b-0 border-primary-100/60 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{serviceIcon}</span>
                  <span className="text-sm font-medium text-gray-700">{embedData.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={toggleEmbedVisible} className="p-1 text-gray-400 hover:text-gray-600">
                    <HiChevronDown className="w-5 h-5" />
                  </button>
                  <button onClick={closeEmbed} className="p-1 text-red-400 hover:text-red-500">
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <iframe
                src={embedData.embedUrl}
                width="100%"
                height={embedData.service === "apple" ? "450" : "352"}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mini player bar */}
      {hasAnything && (
        <>
          {isMinimized && !embedVisible ? (
            <button
              onClick={() => {
                if (currentVideo) expand();
                else if (activeEmbed) toggleEmbedVisible();
              }}
              className="fixed z-40 w-14 h-14 min-w-[44px] min-h-[44px] gradient-bg text-white rounded-full shadow-lg shadow-primary-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform touch-manipulation bottom-[calc(var(--layout-mobile-nav-h)+1rem)] right-[max(1rem,var(--safe-right))] md:bottom-6 md:right-6"
            >
              <HiMusicalNote className="w-6 h-6" />
            </button>
          ) : !embedVisible && (
            <div className="fixed bottom-(--layout-mobile-nav-h) md:bottom-0 left-0 md:left-(--layout-sidebar-w) right-0 z-40 bg-white/95 backdrop-blur-md border-t border-primary-100/60 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
                <div className="w-8 h-8 gradient-bg-subtle rounded-lg flex items-center justify-center shrink-0">
                  {activeSource === "embed" ? (
                    <span className="text-sm">{serviceIcon}</span>
                  ) : (
                    <HiMusicalNote className="w-4 h-4 text-primary-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {activeSource === "youtube" && currentVideo?.title}
                    {activeSource === "embed" && embedData?.name}
                    {activeSource === "local" && localPlaying}
                    {!activeSource && (currentVideo?.title || embedData?.name || localPlaying)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {activeSource === "youtube" && "YouTube"}
                    {activeSource === "embed" && (embedData?.service === "spotify" ? "Spotify" : embedData?.service === "apple" ? "Apple Music" : embedData?.service === "deezer" ? "Deezer" : t("music.streamingLabel"))}
                    {activeSource === "local" && (t("music.localMusic"))}
                  </p>
                </div>

                {/* Controls based on source */}
                {(activeSource === "local" || (!activeSource && localPlaying)) && (
                  <div className="flex items-center gap-1">
                    <button onClick={playPrevLocal} className="text-gray-400 hover:text-gray-600">
                      <HiBackward className="w-5 h-5" />
                    </button>
                    <button onClick={toggleLocalPause} className="text-primary-600">
                      {localPaused ? <HiPlayCircle className="w-8 h-8" /> : <HiPauseCircle className="w-8 h-8" />}
                    </button>
                    <button onClick={playNextLocal} className="text-gray-400 hover:text-gray-600">
                      <HiForward className="w-5 h-5" />
                    </button>
                    <button onClick={stopLocal} className="text-red-400 hover:text-red-500 text-xs ml-1">
                      {t("music.stop")}
                    </button>
                  </div>
                )}

                {(activeSource === "youtube" || (!activeSource && currentVideo)) && (
                  <div className="flex items-center gap-1">
                    <button onClick={togglePlay} className="text-primary-600 shrink-0">
                      {isPlaying ? <HiPauseCircle className="w-8 h-8" /> : <HiPlayCircle className="w-8 h-8" />}
                    </button>
                    <button onClick={stop} className="text-red-400 hover:text-red-500 text-xs">
                      {t("music.stop")}
                    </button>
                  </div>
                )}

                {activeSource === "embed" && (
                  <div className="flex items-center gap-1">
                    <button onClick={toggleEmbedVisible} className="text-primary-600">
                      <HiChevronUp className="w-6 h-6" />
                    </button>
                    <button onClick={closeEmbed} className="text-red-400 hover:text-red-500 text-xs">
                      {t("music.stop")}
                    </button>
                  </div>
                )}

                <button onClick={minimize} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
