import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "./ui";

export function PublicHeader() {
  return (
    <header className="re-public-header">
      <span className="re-public-header__brand">RE:DAY</span>
      <nav className="re-public-header__links">
        <a href="#about">서비스 소개</a>
        <NavLink to="/login">로그인</NavLink>
      </nav>
    </header>
  );
}

function Sidebar() {
  const { logout } = useAuth();
  const links = [
    { to: "/home", label: "홈" },
    { to: "/jobs", label: "체험하기" },
    { to: "/history", label: "내 기록" },
  ];
  return (
    <aside className="re-sidebar">
      <span className="re-sidebar__brand">RE:DAY</span>
      <nav className="re-sidebar__nav">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="re-sidebar__logout">
        <Button variant="link" onClick={logout}>
          로그아웃
        </Button>
      </div>
    </aside>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="re-app-shell">
      <Sidebar />
      <div className="re-main">
        <header className="re-topbar">
          <span className="re-topbar__title">RE:DAY / {title}</span>
        </header>
        <main className="re-main__content">{children}</main>
      </div>
    </div>
  );
}
