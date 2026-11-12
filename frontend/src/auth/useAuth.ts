import { createContext, useContext } from "react";

export type User = { id: number; name: string; email: string; roles: string[] };
type Auth = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void };
export const AuthContext = createContext<Auth | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider ausente.");
  return auth;
}
