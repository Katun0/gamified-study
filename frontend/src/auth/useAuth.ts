import { createContext, useContext } from "react";

export type Progression = { level: number; xpInLevel: number; xpForNextLevel: number; xpRemaining: number; nextLevelTotalXp: number; progressPercent: number };
export type User = { id: number; name: string; email: string; roles: string[]; totalXp: number; progression?: Progression };
type Auth = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void; updateTotalXp: (userId: number, totalXp: number, progression?: Progression) => void };
export const AuthContext = createContext<Auth | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider ausente.");
  return auth;
}
