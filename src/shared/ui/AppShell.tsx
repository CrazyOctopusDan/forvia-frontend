import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

const menus = [
  { to: '/dashboard', label: '大屏总览' },
  { to: '/config/layout', label: '布局配置' },
  { to: '/config/threshold', label: '阈值配置' },
  { to: '/alarms', label: '报警中心' }
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="left-menu">
        <h1 className="menu-title">Forvia</h1>
        <nav className="menu-nav">
          {menus.map((item) => (
            <Link key={item.to} to={item.to} className={location.pathname.startsWith(item.to) ? 'menu-item active' : 'menu-item'}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
