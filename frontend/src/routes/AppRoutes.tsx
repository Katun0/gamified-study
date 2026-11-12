import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import CreateCourse from "../pages/Courses/CreateCourse";
import CreateLesson from "../pages/Lessons/CreateLesson";
import { AuthProvider } from "../auth/AuthProvider";
import RequireAdmin from "../auth/RequireAdmin";
import RequireUser from "../auth/RequireUser";
import CreateProblem from "../pages/Problems/CreateProblem";
const Trail = lazy(() => import("../pages/Trail/Trail"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireUser />}>
          <Route path="/trails" element={<Suspense fallback={<Box sx={{ p: 4 }}><CircularProgress aria-label="Carregando trilha" /></Box>}><Trail /></Suspense>} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="/courses/new" element={<CreateCourse />} />
          <Route path="/lessons/new" element={<CreateLesson />} />
          <Route path="/problems/new" element={<CreateProblem />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
