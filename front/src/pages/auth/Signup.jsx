import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { showSuccess } from "../../utils/toast";
import { API_URL } from "../../config/config";
import { FcGoogle } from "react-icons/fc";
import "./auth.css";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleSignup = () => {
    setError("");
    setLoading(true);
    window.location.assign(`${API_URL}/auth/google`);
  };

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    otp: "",
    otpId: "",
  });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setFormData({ ...formData, otpId: data.id });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          otp: formData.otp,
          id: formData.otpId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      showSuccess("Registration successful!");
      navigate("/store");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container page">
      <div className="signup-box">
        <div className="signup-header">
          <h1>Create Account</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? "active" : ""}`}>1</div>
            <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>2</div>
            <div className={`step-line ${step >= 3 ? "active" : ""}`}></div>
            <div className={`step ${step >= 3 ? "active" : ""}`}>3</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="signup-form">
            <h2>Step 1: Email Verification</h2>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                minLength={5}
                placeholder="Choose a username (min 5 characters)"
              />
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Sending OTP..." : "Next"}
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>
            <button
              type="button"
              className="google-auth-btn"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <FcGoogle size={20} />
              {loading ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Login
                </Link>
              </p>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleDetailsSubmit} className="signup-form">
            <h2>Step 2: Your Details</h2>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
                placeholder="Create a strong password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                placeholder="Re-enter your password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                minLength={10}
                placeholder="Your phone number (min 10 digits)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address</label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
                rows="3"
                placeholder="Your full delivery address"
              ></textarea>
            </div>

            <div className="form-buttons">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="back-btn"
              >
                Back
              </button>
              <button type="submit" className="signup-btn">
                Next
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="signup-form">
            <h2>Step 3: Verify OTP</h2>
            <p className="otp-info">
              We've sent a verification code to{" "}
              <strong>{formData.email}</strong>
            </p>

            <div className="form-group">
              <label htmlFor="otp">Enter OTP Code</label>
              <input
                type="text"
                id="otp"
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                required
                maxLength={6}
                placeholder="6-digit code"
                className="otp-input"
              />
            </div>

            <div className="form-buttons">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="back-btn"
              >
                Back
              </button>
              <button type="submit" className="signup-btn" disabled={loading}>
                {loading ? "Verifying..." : "Complete Registration"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
