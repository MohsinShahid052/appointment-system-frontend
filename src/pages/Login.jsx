import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Failed to sign in');
    }

    setLoading(false);
  };

  return (
    <div className="center-screen fade-in">
      <div className="card">

        <h2
          style={{
            textAlign: 'center',
            marginBottom: 8,
            color: '#e5e7eb',
            fontWeight: 600,
            letterSpacing: '-0.03em'
          }}
        >
          Welcome Back
        </h2>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#9ca3af',
            marginBottom: 16
          }}
        >
          Sign in to access your barbershop dashboard
        </p>

        {error && (
          <p
            style={{
              background: '#fee2e2',
              padding: '10px',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '14px',
              marginBottom: 12
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            className="input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
