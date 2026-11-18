import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import StudySidebar from "./StudySidebar";
import "../../pages/Trail/Trail.css";
import "../../pages/Admin/Admin.css";

type Props = {
  current: "admin" | "courses" | "lessons" | "problems";
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

export default function AdminLayout({
  current,
  eyebrow,
  title,
  description,
  icon,
  children,
}: Props) {
  return (
    <div className="trail-app sq-admin-app">
      <StudySidebar current={current} />
      <div className="trail-workspace">
        <header className="trail-topbar">
          <span>
            {" "}
            <span className="sq-admin-top-icon">{icon}</span> StudyQuest Studio
          </span>
          <span className="trail-topbar-note">
            Crie experiências que ensinam
          </span>
        </header>
        <main className="sq-admin-main">
          <Box className="sq-admin-heading">
            <div>
              <Typography className="sq-admin-eyebrow">{eyebrow}</Typography>
              <Typography component="h1">{title}</Typography>
              <Typography className="sq-admin-description">
                {description}
              </Typography>
            </div>
            <span className="sq-admin-hero-icon">{icon}</span>
          </Box>
          {children}
        </main>
      </div>
    </div>
  );
}
