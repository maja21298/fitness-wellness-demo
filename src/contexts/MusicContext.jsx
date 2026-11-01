import { createContext, useContext, useState, useRef, useCallback, useMemo } from "react";

const MusicContext = createContext(null);

export const STREAMING_EMBEDS = [
  { id: "spotify-workout", name: "Workout Hits", service: "spotify", embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP?theme=0" },
  { id: "spotify-power", name: "Power Workout", service: "spotify", embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX70RN3TfnE5v?theme=0" },
  { id: "spotify-yoga", name: "Yoga & Meditation", service: "spotify", embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX9uKNf5jGX6m?theme=0" },
  { id: "apple-workout", name: "Pure Workout", service: "apple", embedUrl: "https://embed.music.apple.com/us/playlist/pure-workout/pl.4127667a901b4849b03a5fbdcda4b3d3" },
  { id: "apple-hiit", name: "HIIT Workout", service: "apple", embedUrl: "https://embed.music.apple.com/us/playlist/hiit-workout/pl.aa107e2e66d04eb8ba8ddcf239ebc08d" },
  { id: "apple-yoga", name: "Yoga & Chill", service: "apple", embedUrl: "https://embed.music.apple.com/us/playlist/yoga-chill/pl.3df31dd04d344159b7c38c4c8cf4fd0c" },
];

const PERSONAL_EMBED_STORAGE_KEY = "music_personal_embeds";

function loadPersonalEmbeds() {
  try {
    const raw = localStorage.getItem(PERSONAL_EMBED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPersonalEmbeds(embeds) {
  try {
    localStorage.setItem(PERSONAL_EMBED_STORAGE_KEY, JSON.stringify(embeds));
  } catch {
    // Ignore storage failures.
  }
}

function normalizeAppleMusicUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("music.apple.com")) return null;
    return `${parsed.protocol}//embed.${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function normalizeDeezerUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("deezer.com")) return null;

    const segments = parsed.pathname.split("/").filter(Boolean);
    const resourceIndex = segments.findIndex((part) =>
      ["playlist", "album", "track", "artist"].includes(part),
    );

    if (resourceIndex === -1 || !segments[resourceIndex + 1]) return null;

    const type = segments[resourceIndex];
    const id = segments[resourceIndex + 1];
    return `https://widget.deezer.com/widget/dark/${type}/${id}`;
  } catch {
    return null;
  }
}

function createPersonalEmbed(service, sourceUrl) {
  const cleanedUrl = sourceUrl?.trim();
  if (!cleanedUrl) return null;

  if (service === "apple") {
    const embedUrl = normalizeAppleMusicUrl(cleanedUrl);
    if (!embedUrl) return null;
    return {
      id: "personal-apple",
      name: "My Apple Music",
      service: "apple",
      embedUrl,
      sourceUrl: cleanedUrl,
      personal: true,
    };
  }

  if (service === "deezer") {
    const embedUrl = normalizeDeezerUrl(cleanedUrl);
    if (!embedUrl) return null;
    return {
      id: "personal-deezer",
      name: "My Deezer",
      service: "deezer",
      embedUrl,
      sourceUrl: cleanedUrl,
      personal: true,
    };
  }

  return null;
}

export function MusicProvider({ children }) {
  // YouTube state
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const playerRef = useRef(null);

  // Streaming embed state (Spotify / Apple Music)
  const [activeEmbed, setActiveEmbed] = useState(null);
  const [embedVisible, setEmbedVisible] = useState(false);
  const [personalEmbeds, setPersonalEmbeds] = useState(() => loadPersonalEmbeds());

  // Local audio state
  const [localFiles, setLocalFiles] = useState([]);
  const [localPlaying, setLocalPlaying] = useState(null);
  const [localPaused, setLocalPaused] = useState(false);
  const audioRef = useRef(null);

  // Active source: "youtube" | "embed" | "local" | null
  const [activeSource, setActiveSource] = useState(null);

  const streamingEmbeds = useMemo(
    () => [...STREAMING_EMBEDS, ...personalEmbeds],
    [personalEmbeds],
  );

  const playVideo = useCallback((videoId, title) => {
    if (audioRef.current) { audioRef.current.pause(); }
    setLocalPlaying(null);
    setCurrentVideo({ videoId, title });
    setIsPlaying(true);
    setIsMinimized(false);
    setActiveSource("youtube");
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (p) {
      try {
        if (isPlaying) p.pauseVideo();
        else p.playVideo();
      } catch {
        // Player may not be ready yet.
      }
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying]);

  const stop = useCallback(() => {
    const p = playerRef.current;
    if (p) {
      try {
        p.stopVideo();
      } catch {
        // Ignore player stop failures when iframe is unavailable.
      }
    }
    setCurrentVideo(null);
    setIsPlaying(false);
    if (activeSource === "youtube") setActiveSource(null);
  }, [activeSource]);

  const minimize = useCallback(() => setIsMinimized(true), []);
  const expand = useCallback(() => setIsMinimized(false), []);

  const openEmbed = useCallback((embedId) => {
    setActiveEmbed(embedId);
    setEmbedVisible(true);
    setActiveSource("embed");
  }, []);

  const closeEmbed = useCallback(() => {
    setActiveEmbed(null);
    setEmbedVisible(false);
    if (activeSource === "embed") setActiveSource(null);
  }, [activeSource]);

  const toggleEmbedVisible = useCallback(() => {
    setEmbedVisible((v) => !v);
  }, []);

  const savePersonalEmbed = useCallback((service, sourceUrl) => {
    const nextEmbed = createPersonalEmbed(service, sourceUrl);
    if (!nextEmbed) return null;

    setPersonalEmbeds((prev) => {
      const filtered = prev.filter((embed) => embed.service !== service);
      const next = [...filtered, nextEmbed];
      persistPersonalEmbeds(next);
      return next;
    });

    return nextEmbed;
  }, []);

  const removePersonalEmbed = useCallback((service) => {
    setPersonalEmbeds((prev) => {
      const next = prev.filter((embed) => embed.service !== service);
      persistPersonalEmbeds(next);
      return next;
    });
    if (activeEmbed === `personal-${service}`) {
      setActiveEmbed(null);
      setEmbedVisible(false);
      if (activeSource === "embed") setActiveSource(null);
    }
  }, [activeEmbed, activeSource]);

  const addLocalFiles = useCallback((files) => {
    const newFiles = files
      .filter((f) => f.type.startsWith("audio/"))
      .map((f) => ({
        name: f.name.replace(/\.[^.]+$/, ""),
        url: URL.createObjectURL(f),
      }));
    setLocalFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const playLocalFile = useCallback((file) => {
    if (audioRef.current) {
      audioRef.current.src = file.url;
      audioRef.current.play();
      setLocalPlaying(file.name);
      setLocalPaused(false);
      setActiveSource("local");
    }
  }, []);

  const toggleLocalPause = useCallback(() => {
    if (!audioRef.current) return;
    if (localPaused) { audioRef.current.play(); }
    else { audioRef.current.pause(); }
    setLocalPaused(!localPaused);
  }, [localPaused]);

  const stopLocal = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setLocalPlaying(null);
    setLocalPaused(false);
    if (activeSource === "local") setActiveSource(null);
  }, [activeSource]);

  const playNextLocal = useCallback(() => {
    const idx = localFiles.findIndex((f) => f.name === localPlaying);
    if (idx >= 0 && idx < localFiles.length - 1) {
      playLocalFile(localFiles[idx + 1]);
    }
  }, [localFiles, localPlaying, playLocalFile]);

  const playPrevLocal = useCallback(() => {
    const idx = localFiles.findIndex((f) => f.name === localPlaying);
    if (idx > 0) {
      playLocalFile(localFiles[idx - 1]);
    }
  }, [localFiles, localPlaying, playLocalFile]);

  const stopAll = useCallback(() => {
    stop();
    closeEmbed();
    stopLocal();
    setActiveSource(null);
  }, [stop, closeEmbed, stopLocal]);

  return (
    <MusicContext.Provider
      value={{
        currentVideo, isPlaying, isMinimized, playVideo, togglePlay, stop, minimize, expand, playerRef,
        activeEmbed, embedVisible, openEmbed, closeEmbed, toggleEmbedVisible,
        streamingEmbeds, personalEmbeds, savePersonalEmbed, removePersonalEmbed,
        localFiles, localPlaying, localPaused, audioRef, addLocalFiles, playLocalFile, toggleLocalPause, stopLocal, playNextLocal, playPrevLocal,
        activeSource, stopAll,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
