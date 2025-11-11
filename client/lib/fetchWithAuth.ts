import { authUtils } from "./api";

export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("authToken");

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      // Automatically log out and redirect to login on auth failures
      try {
        authUtils.logout();
      } catch (e) {
        // best-effort
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        window.location.href = "/login";
      }
    }

    return response;
  } catch (error) {
    // Network errors still bubble up
    throw error;
  }
}
