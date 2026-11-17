export const apiUrl = (import.meta.env.VITE_API_URL || "https://gamified-study.onrender.com").replace(/\/$/, "");

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  const token = localStorage.getItem("auth_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token && localStorage.getItem("auth_token") === token) {
      localStorage.removeItem("auth_token");
      window.dispatchEvent(new Event("session-expired"));
    }
    if (response.status === 403) {
      throw new Error("Você não tem permissão para realizar esta ação.");
    }
    throw new Error(data.error || data.message || "Não foi possível concluir a solicitação.");
  }

  return data as T;
}
