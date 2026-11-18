import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  CodeRounded,
  RouteRounded,
  DashboardCustomizeRounded,
  LogoutRounded,
  SchoolRounded,
  MenuBookRounded,
  TerminalRounded,
} from "@mui/icons-material";

type Props = {
  current?: "trails" | "admin" | "courses" | "lessons" | "problems";
};

export default function StudySidebar({ current }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const admin = user?.roles?.includes("ROLE_ADMIN") ?? false;
  const item = (
    path: string,
    label: string,
    icon: ReactNode,
    active: boolean,
  ) => (
    <NavLink
      to={path}
      className={active ? "trail-nav-active" : undefined}
      aria-current={active ? "page" : undefined}
    >
      {icon} {label}
    </NavLink>
  );
  const leave = async () => {
    await logout();
    navigate("/", { replace: true });
  };
  return (
    <aside className="trail-sidebar">
      <NavLink
        className="trail-brand"
        to="/trails"
        aria-label="StudyQuest — minha trilha"
      >
        <span>
          <CodeRounded />
        </span>{" "}
        Study<span className="trail-brand-accent">Quest</span>
      </NavLink>
      <span className="trail-nav-label">SUA JORNADA</span>
      <nav aria-label="Navegação principal">
        {item(
          "/trails",
          "Minha trilha",
          <RouteRounded />,
          current === "trails",
        )}
        {admin &&
          item(
            "/admin",
            "Painel de criação",
            <DashboardCustomizeRounded />,
            current === "admin",
          )}
        {admin && (
          <span className="trail-nav-label trail-nav-subtitle">
            GERENCIAR CONTEÚDO
          </span>
        )}
        {admin &&
          item(
            "/courses/new",
            "Criar curso",
            <SchoolRounded />,
            current === "courses",
          )}
        {admin &&
          item(
            "/lessons/new",
            "Criar lição",
            <MenuBookRounded />,
            current === "lessons",
          )}
        {admin &&
          item(
            "/problems/new",
            "Criar desafio",
            <TerminalRounded />,
            current === "problems",
          )}
      </nav>
      <div className="trail-sidebar-bottom">
        <div className="trail-avatar">
          {user?.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <strong>{user?.name || "Estudante"}</strong>
          <small>{admin ? "Criador de missões" : "Um passo de cada vez"}</small>
          <small aria-live="polite">{(user?.totalXp ?? 0).toLocaleString("pt-BR")} XP conquistados</small>
        </div>
        <button aria-label="Sair da conta" onClick={leave}>
          <LogoutRounded />
        </button>
      </div>
    </aside>
  );
}
