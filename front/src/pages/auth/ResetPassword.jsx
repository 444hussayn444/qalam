import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { showSuccess, showError } from '../../utils/toast';
import { API_URL } from '../../config/config';
import './auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Password reset successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="signup-container page">
        <div className="signup-box">
          <div className="signup-header">
            <h1>Invalid Link</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#ccc' }}>
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password" className="auth-link" style={{ display: 'inline-block', marginTop: '2rem' }}>
              Request New Link
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
          <h1>Reset Password</h1>
          <p style={{ color: '#999' }}>
            Enter your new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              minLength={8}
              placeholder="Enter new password (min 8 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="Re-enter new password"
            />
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
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
