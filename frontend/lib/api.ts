import type {
  BotFeedbackResponse,
  AuthResponse,
  AuthUser,
  GetRoundResponse,
  LeaderboardResponse,
  LoginRequest,
  LocationOptionCountry,
  LocationSelectionResponse,
  RegisterRequest,
  RegisterStartResponse,
  UpdateProfileRequest,
  VerifyRegistrationRequest,
  VoteRoundRequest,
  VoteRoundResponse
} from "@/lib/types";

const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 60000;
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0"
};

function withCacheBuster(path: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}t=${Date.now()}`;
}

function errorMessageFromUnknown(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Request failed";
}

function alertAuthError(error: unknown): void {
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(getErrorMessage(error));
  }
}

function alertConnectingToApi(): void {
  if (typeof window !== "undefined" && typeof window.alert === "function" && API_BASE_URL) {
    window.alert(`Connecting to: ${API_BASE_URL}...`);
  }
}

async function request<T>(path: string, init: RequestInit, accessToken?: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL. Add it in frontend/.env.local and Vercel Environment Variables.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init.headers ?? {})
      },
      credentials: "include",
      cache: "no-store",
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check phone Wi-Fi and backend server availability.");
    }

    throw new Error(`Could not reach API at ${API_BASE_URL}. Check NEXT_PUBLIC_API_URL and backend CORS settings.`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const errorBody = (await response.json()) as { detail?: unknown };
      const backendMessage = errorMessageFromUnknown(errorBody.detail);
      throw new Error(backendMessage ?? `Request failed with status ${response.status}`);
    }

    const errorPayload = await response.text();
    throw new Error(errorPayload || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function registerUser(payload: RegisterRequest): Promise<RegisterStartResponse> {
  alertConnectingToApi();
  try {
    return await request<RegisterStartResponse>(
      withCacheBuster("/register"),
      {
        method: "POST",
        headers: NO_CACHE_HEADERS,
        body: JSON.stringify(payload)
      },
      undefined
    );
  } catch (error) {
    alertAuthError(error);
    throw error;
  }
}

export async function verifyRegistration(payload: VerifyRegistrationRequest): Promise<AuthResponse> {
  alertConnectingToApi();
  try {
    return await request<AuthResponse>(
      withCacheBuster("/register/verify"),
      {
        method: "POST",
        headers: NO_CACHE_HEADERS,
        body: JSON.stringify(payload)
      },
      undefined
    );
  } catch (error) {
    alertAuthError(error);
    throw error;
  }
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  alertConnectingToApi();
  try {
    return await request<AuthResponse>(
      withCacheBuster("/login"),
      {
        method: "POST",
        headers: NO_CACHE_HEADERS,
        body: JSON.stringify(payload)
      },
      undefined
    );
  } catch (error) {
    alertAuthError(error);
    throw error;
  }
}

export async function fetchRound(accessToken: string): Promise<GetRoundResponse> {
  return request<GetRoundResponse>(
    "/profiles",
    {
      method: "GET"
    },
    accessToken
  );
}

export async function submitRoundVotes(payload: VoteRoundRequest, accessToken: string): Promise<VoteRoundResponse> {
  return request<VoteRoundResponse>(
    "/vote",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  return request<AuthUser>(
    "/me",
    {
      method: "GET"
    },
    accessToken
  );
}

export async function updateCurrentUser(payload: UpdateProfileRequest, accessToken: string): Promise<AuthUser> {
  return request<AuthUser>(
    "/me",
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}

export async function fetchLeaderboard(accessToken: string) {
  return request<LeaderboardResponse>(
    "/leaderboard",
    {
      method: "GET"
    },
    accessToken
  );
}

export async function fetchBotFeedback(accessToken: string): Promise<BotFeedbackResponse> {
  return request<BotFeedbackResponse>(
    "/bot-feedback",
    {
      method: "GET"
    },
    accessToken
  );
}

export async function fetchLocationOptions(): Promise<LocationOptionCountry[]> {
  return request<LocationOptionCountry[]>(
    "/location/options",
    {
      method: "GET"
    },
    undefined
  );
}

export async function fetchCurrentLocation(accessToken: string): Promise<LocationSelectionResponse> {
  return request<LocationSelectionResponse>(
    "/location/current",
    {
      method: "GET"
    },
    accessToken
  );
}

export async function setCurrentLocation(
  payload: { country_code: string; country_name?: string; city: string },
  accessToken: string
): Promise<LocationSelectionResponse> {
  return request<LocationSelectionResponse>(
    "/location/select",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}

export async function uploadProfilePicture(file: File, accessToken: string): Promise<AuthUser> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL. Add it in frontend/.env.local and Vercel Environment Variables.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}/upload-profile-picture`, {
      method: "POST",
      body: formData,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      credentials: "include",
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const errorBody = (await response.json()) as { detail?: unknown };
        const backendMessage = errorMessageFromUnknown(errorBody.detail);
        throw new Error(backendMessage ?? `Request failed with status ${response.status}`);
      }

      const errorPayload = await response.text();
      throw new Error(errorPayload || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as AuthUser;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Image upload timed out. Please try again.");
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Could not upload profile image.");
  } finally {
    clearTimeout(timeoutId);
  }
}
