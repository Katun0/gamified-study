import { Navigate, Outlet } from "react-router-dom";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useAuth } from "./useAuth";

export default function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading) return <Box sx={{ p: 4 }}><CircularProgress aria-label="Verificando sessão" /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.includes("ROLE_ADMIN")) return <Alert severity="warning">Esta página é exclusiva para administradores. <a href="/">Voltar ao início</a></Alert>;
  return <Outlet />;
}
