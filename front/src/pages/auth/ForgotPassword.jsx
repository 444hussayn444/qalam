import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { showSuccess, showError } from '../../utils/toast';
import { API_URL } from '../../config/config';
import './auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(data.message);
        setSubmitted(true);
      } else {
        showError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="signup-container page">
        <div className="signup-box">
          <div className="signup-header">
            <h1>Check Your Email</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#ccc', marginBottom: '1rem' }}>
              If an account exists with that email, we've sent password reset instructions.
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              Check your spam folder if you don't see it.
            </p>
            <Link to="/login" className="auth-link" style={{ display: 'inline-block', marginTop: '2rem' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-container page">
      <div className="signup-box">
        <div className="signup-header">
          <h1>Forgot Password</h1>
          <p style={{ color: '#999' }}>
            Enter your email to receive a password reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="auth-footer">
            <p>
              Remember your password? <Link to="/login" className="auth-link">Login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
