// pages/auth/login.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Auth.module.css';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data = await res.json();
      
      // Handle successful login
      if (data.success) {
        router.push('/analytics'); // Redirect to analytics dashboard
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>Login</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="Enter your email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;