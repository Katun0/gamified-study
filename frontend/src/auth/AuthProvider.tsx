import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Stack } from "@mui/material";
import { apiRequest, apiUrl } from "../lib/api";

import { AuthContext, type User, type Progression } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const expire = () => {
      setUser(null);
      setError("");
      navigate("/login", { replace: true, state: { message: "Sua sessão expirou. Entre novamente." } });
    };
    const sync = (event: StorageEvent) => {
      if (event.key === "auth_token" || event.key === null) {
        setUser(null);
        setError("");
        setLoading(true);
        setRevision((value) => value + 1);
      }
    };
    window.addEventListener("session-expired", expire);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("session-expired", expire);
      window.removeEventListener("storage", sync);
    };
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("auth_token");
    const request = token ? apiRequest<User>("/api/me") : Promise.resolve(null);
    request
      .then((currentUser) => {
        if (active && localStorage.getItem("auth_token") === token) setUser(currentUser);
      })
      .catch(() => {
        if (active && localStorage.getItem("auth_token") === token) setError("Não foi possível verificar sua sessão. Tente novamente.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setError("");
    navigate("/login", { replace: true });
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${apiUrl}/api/login_check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "E-mail ou senha inválidos.");
    if (typeof data.token !== "string") throw new Error("A API não retornou um token válido.");
    localStorage.setItem("auth_token", data.token);
    try {
      setUser(await apiRequest<User>("/api/me"));
      setError("");
    } catch (requestError) {
      localStorage.removeItem("auth_token");
      setUser(null);
      throw requestError;
    }
  };

  const updateTotalXp = (userId: number, totalXp: number, progression?: Progression) => {
    if (!Number.isSafeInteger(totalXp) || totalXp < 0) return;
    setUser((current) => {
      if (current?.id !== userId) return current;
      const previous = Number.isFinite(current.totalXp) ? current.totalXp : 0;
      if (totalXp < previous) return current;
      return { ...current, totalXp, progression: progression ?? (totalXp === previous ? current.progression : undefined) };
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateTotalXp }}>
      {error ? <Stack spacing={2} sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => { setError(""); setLoading(true); setRevision((value) => value + 1); }}>Tentar novamente</Button>
        <Button onClick={logout}>Sair</Button>
      </Stack> : children}
    </AuthContext.Provider>
  );
}

