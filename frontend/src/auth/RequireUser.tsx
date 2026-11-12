import { Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./useAuth";

export default function RequireUser() {
  const { user, loading } = useAuth();
  if (loading) return <Box sx={{ p: 4 }}><CircularProgress aria-label="Verificando sessão" /></Box>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
