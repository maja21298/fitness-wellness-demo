import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { useMusic } from "../contexts/MusicContext";
import { useAuth } from "../contexts/AuthContext";
import { PLAYLIST_FILTERS, PLAYLIST_ITEMS } from "../data/musicPlaylists";
import {
  HiPlayCircle,
  HiMusicalNote,
  HiPlay,
  HiPause,
  HiForward,
  HiBackward,
  HiFolder,
  HiArrowPath,
  HiLink,
  HiCheckCircle,
  HiXMark,
  HiBookmark,
} from "react-icons/hi2";
import { useTranslation } from "../i18n/useTranslation";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import { ErrorState } from "../components/common/EmptyState";
import {
  getAppleMusicDeveloperToken,
  getAppleMusicConfig,
  getDeezerOAuthUrl,
  parseDeezerAccessTokenFromHash,
} from "../services/musicIntegrations";

const STREAMING_APPS = [
  { id: "spotify", name: "Spotify", icon: "\u{1F3B5}", url: "https://open.spotify.com" },
  { id: "deezer", name: "Deezer", icon: "\u{1F30A}", url: "https://www.deezer.com" },
  { id: "apple", name: "Apple Music", icon: "\u{1F34E}", url: "https://music.apple.com" },
  { id: "ytmusic", name: "YouTube Music", icon: "\u{25B6}\u{FE0F}", url: "https://music.youtube.com" },
];

const PERSONAL_SOURCES = [
  { service: "apple", icon: "\u{1F34E}" },
  { service: "deezer", icon: "\u{1F30A}" },
];

function getServiceIcon(service) {
  if (service === "spotify") return "\u{1F3B5}";
  if (service === "apple") return "\u{1F34E}";
  if (service === "deezer") return "\u{1F30A}";
  if (service === "youtube") return "\u{25B6}\u{FE0F}";
  return "\u{1F3A7}";
}

function getPlaceholder(service, t) {
  return service === "apple" ? t("music.linkPlaceholderApple") : t("music.linkPlaceholderDeezer");
}

export default function MusicPage() {
  const { t } = useTranslation();
  const { musicConnections, saveMusicConnections } = useAuth();
  const {
    playVideo,
    currentVideo,
    isPlaying,
    activeEmbed,
    openEmbed,
    closeEmbed,
    embedVisible,
    toggleEmbedVisible,
    streamingEmbeds,
    personalEmbeds,
    savePersonalEmbed,
    removePersonalEmbed,
    localFiles,
    localPlaying,
    localPaused,
    addLocalFiles,
    playLocalFile,
    toggleLocalPause,
    playNextLocal,
    playPrevLocal,
  } = useMusic();

  const [personalLinks, setPersonalLinks] = useState({ apple: "", deezer: "" });
  const [connectState, setConnectState] = useState({ apple: "idle", deezer: "idle" });
  const [activePlaylistFilter, setActivePlaylistFilter] = useState("all");
  const deezerCallbackHandledRef = useRef(false);
  const fileInputRef = useRef(null);

  const playlists = useMemo(
    () => PLAYLIST_ITEMS.map((cat) => ({
      key: cat.categoryKey,
      category: t(cat.categoryKey),
      icon: cat.icon,
      filter: cat.filter,
      accentClass: cat.accentClass,
      iconClass: cat.iconClass,
      items: cat.items.map((item) => ({
        ...item,
        displayTitle: item.titleKey ? t(item.titleKey) : item.title,
      })),
    })),
    [t],
  );

  const filteredPlaylists = useMemo(
    () => (activePlaylistFilter === "all"
      ? playlists
      : playlists.filter((cat) => cat.filter === activePlaylistFilter)),
    [activePlaylistFilter, playlists],
  );

  const directPlayCount = useMemo(
    () => filteredPlaylists.reduce((total, cat) => total + cat.items.length, 0),
    [filteredPlaylists],
  );

  const readyNowCount = directPlayCount + streamingEmbeds.length;

  const personalByService = useMemo(
    () => Object.fromEntries(personalEmbeds.map((embed) => [embed.service, embed])),
    [personalEmbeds],
  );

  useEffect(() => {
    const deezerData = parseDeezerAccessTokenFromHash();
    if (!deezerData?.accessToken || deezerCallbackHandledRef.current) return;
    deezerCallbackHandledRef.current = true;

    const nextConnections = {
      ...(musicConnections || {}),
      deezer: {
        connected: true,
        accessToken: deezerData.accessToken,
        expiresIn: deezerData.expiresIn,
        connectedAt: new Date().toISOString(),
      },
    };
    saveMusicConnections(nextConnections);

    if (window.location.hash.includes("access_token")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [musicConnections, saveMusicConnections]);

  const handlePlay = useCallback((videoId, title) => {
    playVideo(videoId, title);
  }, [playVideo]);

  const handleFileSelect = (e) => {
    addLocalFiles(Array.from(e.target.files));
  };

  const shufflePlay = useCallback(
    (_categoryKey, items) => {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      handlePlay(randomItem.videoId, randomItem.title);
    },
    [handlePlay],
  );

  const handleSavePersonalSource = (service) => {
    const saved = savePersonalEmbed(service, personalLinks[service]);
    if (!saved) {
      return;
    }
    setPersonalLinks((prev) => ({ ...prev, [service]: "" }));
    openEmbed(saved.id);
  };

  const handleAppleConnect = async () => {
    setConnectState((prev) => ({ ...prev, apple: "loading" }));
    try {
      const { token, expiresAt } = await getAppleMusicDeveloperToken();
      const config = getAppleMusicConfig();
      const nextConnections = {
        ...(musicConnections || {}),
        apple: {
          connected: true,
          developerToken: token,
          expiresAt,
          appName: config.appName,
          build: config.build,
          connectedAt: new Date().toISOString(),
          status: "developer-token-ready",
        },
      };
      await saveMusicConnections(nextConnections);
      setConnectState((prev) => ({ ...prev, apple: "connected" }));
    } catch {
      setConnectState((prev) => ({ ...prev, apple: "error" }));
    }
  };

  const handleDeezerConnect = () => {
    setConnectState((prev) => ({ ...prev, deezer: "idle" }));
    const oauthUrl = getDeezerOAuthUrl("music-page");
    if (!oauthUrl) {
      setConnectState((prev) => ({ ...prev, deezer: "error" }));
      return;
    }
    window.location.href = oauthUrl;
  };

  const handleDisconnectProvider = async (service) => {
    const nextConnections = { ...(musicConnections || {}) };
    delete nextConnections[service];
    await saveMusicConnections(nextConnections);
    setConnectState((prev) => ({ ...prev, [service]: "idle" }));
    if (service === "apple" || service === "deezer") {
      removePersonalEmbed(service);
    }
  };

  return (
    <div className="app-mobile-page p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-28">
      <MobilePageHeader title={t("music.title")} />
      <div>
        <h1 className="app-hide-on-mobile-header text-2xl font-bold text-gray-900">{t("music.title")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("music.desc")}</p>
      </div>

      <div className="app-card space-y-4 sm:!p-5">
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">{t("music.connectTitle")}</h2>
          <p className="text-sm text-gray-400">{t("music.connectDesc")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {PERSONAL_SOURCES.map((item) => {
            const connected = personalByService[item.service];
            const accountConnected = musicConnections?.[item.service]?.connected;
            return (
              <div key={item.service} className="rounded-2xl border border-primary-100/60 bg-primary-50/20 p-3.5 sm:p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-primary-100 text-xl shadow-sm">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {item.service === "apple" ? t("music.connectApple") : t("music.connectDeezer")}
                      </p>
                      <p className={`text-xs ${connected ? "text-emerald-600" : "text-gray-400"}`}>
                        {accountConnected || connected ? t("music.connected") : t("music.notConnected")}
                      </p>
                    </div>
                  </div>
                  {accountConnected || connected ? <HiCheckCircle className="w-5 h-5 text-emerald-500" /> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.service === "apple" ? (
                    <button
                      type="button"
                      onClick={handleAppleConnect}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-primary-200 bg-white text-primary-700 text-sm font-medium hover:bg-primary-50"
                    >
                      <HiLink className="w-4 h-4" />
                      {connectState.apple === "loading" ? t("common.loading") : t("music.connectApple")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDeezerConnect}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-primary-200 bg-white text-primary-700 text-sm font-medium hover:bg-primary-50"
                    >
                      <HiLink className="w-4 h-4" />
                      {t("music.connectDeezer")}
                    </button>
                  )}

                  {musicConnections?.[item.service]?.connected ? (
                    <button
                      type="button"
                      onClick={() => handleDisconnectProvider(item.service)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-200 bg-white text-red-500 text-sm font-medium hover:bg-red-50"
                    >
                      <HiXMark className="w-4 h-4" />
                      {t("music.removeSource")}
                    </button>
                  ) : null}
                </div>

                <details className="rounded-2xl border border-primary-100/60 bg-white/80 px-3 py-2.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-700 [&::-webkit-details-marker]:hidden">
                    <span>{t("common.details")}</span>
                    <span className="text-xs text-gray-400">{t("music.saveSource")} · {t("music.openSource")}</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <input
                      type="url"
                      value={personalLinks[item.service]}
                      onChange={(e) => setPersonalLinks((prev) => ({ ...prev, [item.service]: e.target.value }))}
                      placeholder={getPlaceholder(item.service, t)}
                      className="w-full rounded-xl border border-primary-100 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSavePersonalSource(item.service)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90"
                      >
                        <HiLink className="w-4 h-4" />
                        {t("music.saveSource")}
                      </button>

                      {connected ? (
                        <button
                          type="button"
                          onClick={() => openEmbed(connected.id)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-primary-200 bg-white text-primary-700 text-sm font-medium hover:bg-primary-50"
                        >
                          <HiPlayCircle className="w-4 h-4" />
                          {t("music.openSource")}
                        </button>
                      ) : null}
                    </div>

                    {item.service === "apple" &&
                    connectState.apple === "error" &&
                    !accountConnected &&
                    !connected ? (
                      <ErrorState
                        title={t("music.connectErrorAppleTitle")}
                        message={t("music.connectErrorAppleHint")}
                        onRetry={handleAppleConnect}
                        retryLabel={t("common.tryAgain")}
                      />
                    ) : null}
                    {item.service === "deezer" &&
                    connectState.deezer === "error" &&
                    !accountConnected &&
                    !connected ? (
                      <ErrorState
                        title={t("music.connectErrorDeezerTitle")}
                        message={t("music.connectErrorDeezerHint")}
                        onRetry={handleDeezerConnect}
                        retryLabel={t("common.tryAgain")}
                      />
                    ) : null}

                    <p className="text-xs text-gray-400">{t("music.personalSourceNote")}</p>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </div>

      <div className="app-card space-y-4 sm:!p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="font-semibold text-gray-900 text-base sm:text-lg">{t("music.streamingPlaylists")}</h2>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
              {readyNowCount}+ {t("music.directReady")}
            </span>
          </div>
          <p className="text-sm text-gray-400">{t("music.streamingDesc")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {streamingEmbeds.map((embed) => {
            const isActive = activeEmbed === embed.id;
            return (
              <button
                key={embed.id}
                onClick={() => (isActive ? closeEmbed() : openEmbed(embed.id))}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-50 border-primary-300 text-primary-700 ring-2 ring-primary-200"
                    : "bg-white border-primary-100/60 text-gray-700 hover:bg-primary-50/30 hover:shadow-sm"
                }`}
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-50 text-xl shrink-0">
                  {getServiceIcon(embed.service)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm">{embed.name}</p>
                  <p className="text-[11px] text-gray-400">{embed.service === "apple" ? "Apple Music" : embed.service === "deezer" ? "Deezer" : "Spotify"}</p>
                </div>
                {embed.personal ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-semibold">
                    <HiBookmark className="w-3 h-3" />
                  </span>
                ) : null}
                {isActive && <HiMusicalNote className="w-4 h-4 text-primary-500 ml-auto shrink-0 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {activeEmbed && !embedVisible && (
          <button
            onClick={toggleEmbedVisible}
            className="w-full py-2.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
          >
            {t("music.showPlayer")}
          </button>
        )}

        {activeEmbed && (
          <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
            {t("music.keepPlaying")}
          </p>
        )}
      </div>

      <div className="app-card sm:!p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 text-base sm:text-lg">{t("music.openApp")}</h2>
            <p className="text-sm text-gray-400">{t("music.openAppDesc")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {STREAMING_APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => window.open(app.url, "_blank")}
              className="holo-border inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border border-primary-100/60 bg-white hover:shadow-sm transition-all"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-lg">{app.icon}</span>
              <span className="text-sm font-medium text-gray-700">{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="app-card sm:!p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 text-base sm:text-lg">{t("music.localMusic")}</h2>
            <p className="text-sm text-gray-400">{t("music.addFiles")}</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <HiFolder className="w-4 h-4" /> {t("music.addFiles")}
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFileSelect} className="hidden" />
        </div>

        {localPlaying && (
          <div className="mb-4 p-3.5 gradient-bg-subtle rounded-2xl border border-primary-100">
            <p className="text-[11px] text-primary-500 font-medium mb-1">{t("music.nowPlaying")}</p>
            <p className="font-semibold text-gray-900 truncate text-sm">{localPlaying}</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <button onClick={playPrevLocal} className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:bg-white transition-colors">
                <HiBackward className="w-5 h-5" />
              </button>
              <button onClick={toggleLocalPause} className="w-12 h-12 rounded-full gradient-bg text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity">
                {localPaused ? <HiPlay className="w-5 h-5 ml-0.5" /> : <HiPause className="w-5 h-5" />}
              </button>
              <button onClick={playNextLocal} className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:bg-white transition-colors">
                <HiForward className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-center text-emerald-600 mt-2">{t("music.keepPlaying")}</p>
          </div>
        )}

        {localFiles.length === 0 ? (
          <p className="text-sm text-gray-400">{t("music.noLocalFiles")}</p>
        ) : (
          <div className="space-y-1.5">
            {localFiles.map((file, i) => {
              const isCurrent = localPlaying === file.name;
              return (
                <button
                  key={i}
                  onClick={() => playLocalFile(file)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    isCurrent ? "bg-primary-50 border-primary-300 shadow-sm" : "bg-white border-primary-100/60 hover:bg-primary-50/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? "gradient-bg text-white" : "bg-primary-50 text-primary-400"}`}>
                    {isCurrent && !localPaused ? <HiMusicalNote className="w-5 h-5" /> : <HiPlay className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm truncate ${isCurrent ? "text-primary-700" : "text-gray-900"}`}>{file.name}</p>
                    {isCurrent && !localPaused && <p className="text-xs text-primary-500">{t("music.nowPlaying")}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900 text-base sm:text-lg">{t("music.curatedPlaylists")}</h2>
          <p className="text-sm text-gray-400 mt-1">{t("music.directMixesDesc")}</p>
        </div>
        <div className="hidden sm:inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
          {readyNowCount}+ {t("music.directReady")}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLAYLIST_FILTERS.map((filter) => {
          const active = activePlaylistFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActivePlaylistFilter(filter.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white border border-primary-100 text-gray-600 hover:bg-primary-50"
              }`}
            >
              <span className="text-base leading-none">{filter.icon}</span>
              <span>{t(filter.labelKey)}</span>
            </button>
          );
        })}
      </div>
      {filteredPlaylists.map((cat) => (
        <div key={cat.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl text-xl ${cat.iconClass}`}>{cat.icon}</span>
              <h3 className="font-semibold text-gray-900">{cat.category}</h3>
            </div>
            <button
              onClick={() => shufflePlay(cat.key, cat.items)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <HiArrowPath className="w-3.5 h-3.5" /> {t("music.shuffle")}
            </button>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-3xl bg-gradient-to-br ${cat.accentClass} p-3`}>
            {cat.items.map((item) => {
              const isCurrent = currentVideo?.videoId === item.videoId && isPlaying;
              return (
                <button
                  key={item.videoId}
                  onClick={() => handlePlay(item.videoId, item.displayTitle || item.title)}
                  className={`holo-border flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                    isCurrent ? "bg-primary-50 border-primary-300 shadow-sm shadow-primary-100" : "bg-white border-primary-100/60 hover:shadow-md hover:shadow-primary-100/20"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? "gradient-bg text-white" : "bg-primary-50 text-primary-400"}`}>
                    {isCurrent ? <HiMusicalNote className="w-5 h-5" /> : <HiPlayCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${isCurrent ? "text-primary-700" : "text-gray-900"}`}>{item.displayTitle || item.title}</p>
                    {isCurrent && <p className="text-xs text-primary-500">{t("music.nowPlaying")}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
