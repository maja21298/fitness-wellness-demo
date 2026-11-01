const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

const REGION_MAP = {
  hr: "HR", it: "IT", es: "ES", de: "DE", fr: "FR", pt: "PT", en: "US",
};

export async function searchYouTube(query, lang = "en") {
  if (!query?.trim()) return [];

  if (YT_API_KEY) {
    const results = await tryOfficialApi(query, lang);
    if (results.length > 0) return results;
  }

  const scrapeResults = await tryScrapeYouTube(query, lang);
  if (scrapeResults.length > 0) return scrapeResults;

  return [];
}

async function tryOfficialApi(query, lang) {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: query,
      maxResults: "12",
      regionCode: REGION_MAP[lang] || "US",
      relevanceLanguage: lang,
      key: YT_API_KEY,
    });
    const res = await fetch(`${YT_API_BASE}/search?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        videoId: item.id.videoId,
        title: decodeHtml(item.snippet?.title || "Unknown"),
        thumbnail:
          item.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
        channel: item.snippet?.channelTitle || "",
        duration: 0,
        views: 0,
      }));
  } catch {
    return [];
  }
}

async function tryScrapeYouTube(query, lang) {
  const gl = REGION_MAP[lang] || "US";
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=${lang}&gl=${gl}`;

  const strategies = [
    () => fetchViaAllOrigins(ytUrl),
    () => fetchViaCorsProxy(ytUrl),
    () => fetchViaCodeTabs(ytUrl),
  ];

  for (const strategy of strategies) {
    try {
      const html = await strategy();
      if (!html) continue;
      const results = extractVideosFromHtml(html);
      if (results.length > 0) return results;
    } catch {
      continue;
    }
  }

  return [];
}

async function fetchViaAllOrigins(url) {
  const res = await fetch(
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(12000) },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json?.contents || null;
}

async function fetchViaCorsProxy(url) {
  const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  return await res.text();
}

async function fetchViaCodeTabs(url) {
  const res = await fetch(
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(12000) },
  );
  if (!res.ok) return null;
  return await res.text();
}

function extractVideosFromHtml(html) {
  try {
    const data = extractYtInitialData(html);
    if (!data) return [];

    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents || [];

    const results = [];
    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const vr = item?.videoRenderer;
        if (!vr?.videoId) continue;
        results.push({
          videoId: vr.videoId,
          title:
            vr.title?.runs?.map((r) => r.text).join("") || "Unknown",
          thumbnail:
            vr.thumbnail?.thumbnails?.at(-1)?.url ||
            `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`,
          channel:
            vr.ownerText?.runs?.map((r) => r.text).join("") || "",
          duration: parseDuration(
            vr.lengthText?.simpleText || vr.lengthText?.accessibility?.accessibilityData?.label,
          ),
          views: parseViewCount(
            vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText,
          ),
        });
        if (results.length >= 12) return results;
      }
    }
    return results;
  } catch {
    return [];
  }
}

function extractYtInitialData(html) {
  const markers = ["var ytInitialData = ", "ytInitialData = ", "window[\"ytInitialData\"] = "];
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx === -1) continue;
    const start = html.indexOf("{", idx);
    if (start === -1) continue;

    let depth = 0;
    for (let i = start; i < Math.min(start + 500000, html.length); i++) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}") depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          break;
        }
      }
    }
  }
  return null;
}

function parseDuration(text) {
  if (!text) return 0;
  if (text.includes(":")) {
    const parts = text.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  const h = text.match(/(\d+)\s*hour/i);
  const m = text.match(/(\d+)\s*min/i);
  const s = text.match(/(\d+)\s*sec/i);
  return (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0) + (s ? +s[1] : 0);
}

function parseViewCount(text) {
  if (!text) return 0;
  const num = text.replace(/[^0-9.]/g, "");
  if (text.toLowerCase().includes("b")) return Math.round(parseFloat(num) * 1e9);
  if (text.toLowerCase().includes("m")) return Math.round(parseFloat(num) * 1e6);
  if (text.toLowerCase().includes("k")) return Math.round(parseFloat(num) * 1e3);
  return parseInt(num, 10) || 0;
}

function decodeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatViews(n) {
  if (!n) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}
