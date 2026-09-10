import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "../../redux/slices/authSlice";
import { showSuccess } from "../../utils/toast";
import "./auth.css";
import { API_URL } from "../../config/config";
import { FcGoogle } from "react-icons/fc";
import { setToken, setUser } from "../../redux/slices/authSlice";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("token");
    const encodedUser = hash.get("user");
    const googleError = hash.get("google_error");
    if (googleError) {
      setError(googleError);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    if (token && encodedUser) {
      try {
        dispatch(setToken(token));
        dispatch(setUser(JSON.parse(encodedUser)));
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/store", { replace: true });
      } catch {
        setError("Google authentication response was invalid");
      }
    }
  }, [dispatch, navigate]);

  const handleGoogleLogin = () => {
    setError("");
    setLoading(true);
    window.location.assign(`${API_URL}/auth/google`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await dispatch(loginUser(formData)).unwrap();

      // Success - user and token are already saved in Redux
      showSuccess("Login successful!");
      navigate("/store");
    } catch (err) {
      setError(err || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container page">
      <div className="signup-box">
        <div className="signup-header">
          <h1>Welcome Back</h1>
          <p className="subtitle">Login to your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="Enter your password"
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: "1rem" }}>
            <Link
              to="/forgot-password"
              className="auth-link"
              style={{ fontSize: "0.9rem" }}
            >
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>
          <button
            type="button"
            className="google-auth-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <FcGoogle size={20} />
            {loading ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
