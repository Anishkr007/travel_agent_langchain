import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Map, User as UserIcon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const { logout } = useAuth();
  
  return (
    <>
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Map size={20} />
        <span>Chat</span>
      </Link>
      <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <UserIcon size={20} />
        <span>Profile</span>
      </Link>
      <button onClick={logout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  // If not logged in, just show routes without sidebar
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-icon">
            <Map size={20} />
          </div>
          <h1 className="sidebar-title">Wander AI</h1>
        </div>
        
        <nav className="sidebar-nav">
          <Navigation />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Header */}
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Map size={24} style={{ color: 'var(--primary-color)' }} />
            <span style={{ fontWeight: 'bold' }}>Wander AI</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Chat</Link>
            <Link to="/profile" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Profile</Link>
          </div>
        </header>
        
        <Routes>
          <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
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
