import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Map, User as UserIcon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthContext';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const active = useLocation().pathname === to;
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative
        ${active
          ? 'bg-surface text-text'
          : 'text-text-secondary hover:text-text hover:bg-surface-hover'
        }
      `}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-sm bg-accent" />}
      <span className={active ? 'text-accent' : ''}>{icon}</span>
      {label}
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';
  const displayName = user?.name || user?.email?.split('@')[0] || 'Traveler';

  return (
    <aside className="hidden md:flex w-[220px] flex-col bg-bg border-r border-border shrink-0">
      {/* Brand */}
      <div className="px-4 pt-5 pb-6">
        <span className="text-[15px] font-semibold text-text tracking-tight">Wander AI</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        <NavItem to="/"        icon={<Map size={15} />}      label="Chat" />
        <NavItem to="/profile" icon={<UserIcon size={15} />}  label="Profile" />
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-text-secondary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-text truncate">{displayName}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-text-muted hover:text-error transition-colors p-1"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="text-text-secondary text-sm">Loading…</span>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="text-text-secondary text-sm">Loading…</span>
    </div>
  );

  if (!user) {
    return (
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*"         element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-bg font-sans overflow-hidden">
      <Sidebar />

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-20 bg-bg border-b border-border px-4 py-2.5 flex justify-between items-center">
        <span className="text-[14px] font-semibold text-text">Wander AI</span>
        <div className="flex gap-4 text-[13px] font-medium">
          <Link to="/"        className="text-text-secondary hover:text-text transition-colors">Chat</Link>
          <Link to="/profile" className="text-text-secondary hover:text-text transition-colors">Profile</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden md:pt-0 pt-10">
        <Routes>
          <Route path="/"        element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*"        element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
