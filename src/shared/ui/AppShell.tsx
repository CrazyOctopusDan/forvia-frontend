import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useShellStore } from '@/shared/ui/shellStore';

const menus = [
  { to: '/dashboard', label: '大屏总览' },
  { to: '/config/layout', label: '布局配置' },
  { to: '/config/threshold', label: '阈值配置' },
  { to: '/alarms', label: '报警中心' }
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const menuCollapsed = useShellStore((state) => state.menuCollapsed);
  const theme = useShellStore((state) => state.theme);
  const toggleMenu = useShellStore((state) => state.toggleMenu);
  const toggleTheme = useShellStore((state) => state.toggleTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className={`app-shell ${menuCollapsed ? 'collapsed' : ''}`}>
      {!menuCollapsed ? (
        <aside className="left-menu">
          <div className="menu-head">
            <h1 className="menu-title">Forvia</h1>
            <button className="menu-toggle" onClick={toggleMenu}>
              {'<<'}
            </button>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            主题: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
          <nav className="menu-nav">
            {menus.map((item) => (
              <Link key={item.to} to={item.to} className={location.pathname.startsWith(item.to) ? 'menu-item active' : 'menu-item'}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
      ) : null}
      {menuCollapsed ? (
        <div className="shell-top-brand">
          <strong>Forvia</strong>
          <button className="menu-toggle" onClick={toggleMenu}>
            {'>>'}
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      ) : null}
      <main className="main-content">{children}</main>
    </div>
  );
}
