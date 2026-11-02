import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import CreateCourse from "../pages/Courses/CreateCourse";
import CreateLesson from "../pages/Lessons/CreateLesson";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/courses/new" element={<CreateCourse />} />
        <Route path="/lessons/new" element={<CreateLesson />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
