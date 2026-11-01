import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(getApp(), "us-central1");

const getAppleMusicTokenCallable = httpsCallable(functions, "getAppleMusicDeveloperToken");

export async function getAppleMusicDeveloperToken() {
  const response = await getAppleMusicTokenCallable();
  return response.data;
}

export function getAppleMusicConfig() {
  return {
    appName: import.meta.env.VITE_APPLE_MUSIC_APP_NAME || "Fitness Coach",
    build: import.meta.env.VITE_APPLE_MUSIC_BUILD || "1.0.0",
  };
}

export function getDeezerOAuthUrl(state = "") {
  const appId = import.meta.env.VITE_DEEZER_APP_ID;
  const redirectUri = import.meta.env.VITE_DEEZER_REDIRECT_URI;

  if (!appId || !redirectUri) return null;

  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    perms: "basic_access,email,manage_library,listening_history",
  });

  if (state) params.set("state", state);

  return `https://connect.deezer.com/oauth/auth.php?${params.toString()}`;
}

export function parseDeezerAccessTokenFromHash(hash = window.location.hash) {
  const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(cleaned);
  const accessToken = params.get("access_token");
  const expires = params.get("expires");

  if (!accessToken) return null;

  return {
    accessToken,
    expiresIn: expires ? Number(expires) : null,
  };
}
