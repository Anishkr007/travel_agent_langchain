import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { setTokens, fetchWithAuth } from '../lib/auth';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Registration failed');
      }
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      const meRes = await fetchWithAuth('/auth/me');
      if (meRes.ok) {
        const userData = await meRes.json();
        login(userData);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans p-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <h2 className="text-[20px] font-semibold text-text mb-1">Create account</h2>
          <p className="text-[13px] text-text-secondary">Join Wander AI</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-md text-[13px] font-medium text-error bg-error/10 border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[14px] text-text outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[14px] text-text outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[14px] text-text outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full bg-accent text-bg font-medium text-[14px] py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Sign up
          </button>
        </form>

        <p className="mt-6 text-[13px] text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-text hover:text-accent transition-colors underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
