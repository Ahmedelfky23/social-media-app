
const GIS_SRC = "https://accounts.google.com/gsi/client";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;

export interface GoogleUser {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

let scriptPromise: Promise<void> | null = null;

/** Load the Google Identity Services script once. */
export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new GoogleAuthError("Window is not available"));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new GoogleAuthError("Failed to load Google Identity Services")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new GoogleAuthError("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function fetchProfile(accessToken: string): Promise<GoogleUser> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new GoogleAuthError("Failed to fetch Google profile");
  }
  return (await res.json()) as GoogleUser;
}

export async function signInWithGoogle(): Promise<GoogleUser> {
  if (!GOOGLE_CLIENT_ID) {
    throw new GoogleAuthError(
      "Google Client ID is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.",
    );
  }

  await loadGoogleScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new GoogleAuthError("Google Identity Services unavailable");
  }

  return new Promise<GoogleUser>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      callback: async (tokenResponse) => {
        if (!tokenResponse.access_token) {
          reject(new GoogleAuthError("No access token received from Google"));
          return;
        }
        try {
          const profile = await fetchProfile(tokenResponse.access_token);
          resolve(profile);
        } catch (err) {
          reject(
            err instanceof GoogleAuthError
              ? err
              : new GoogleAuthError("Failed to load Google account"),
          );
        }
      },
      error_callback: () => {
        reject(new GoogleAuthError("Google sign-in was cancelled or failed"));
      },
    });

    client.requestAccessToken();
  });
}
