
import { useState } from "react";
import "./login.css";
import { API_BASE_URL } from "../../config/api";

function LoginPage({
  onBack,
  onCreateAccount,
  onSuccess,
  ownerMode = false,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ADMIN AND OWNER BACKEND LOGIN
  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      const selectedRole = ownerMode ? "owner" : "admin";

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Invalid username or password."
        );
      }

      onSuccess(result.user);
    } catch (loginError) {
      setError(
        loginError.message || "Unable to sign in. Please try again."
      );
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1>
          {ownerMode ? "DineConnect Owners" : "DineConnect"}
        </h1>

        <p>
          {ownerMode
            ? "RESTAURANT MANAGEMENT PORTAL"
            : "RESTAURANT QR ORDERING"}
        </p>

        <h2>
          {ownerMode ? "Restaurant Owner Sign In" : "Welcome Back!"}
        </h2>

        <p>
          {ownerMode
            ? "Sign in to manage your restaurant."
            : "Please login to continue."}
        </p>

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>
              {ownerMode ? "Owner Username" : "Admin Username"}
            </label>

            <input
              type="text"
              placeholder={
                ownerMode
                  ? "Enter your owner username"
                  : "Enter your admin username"
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() =>
                setInfo(
                  "Please contact the administrator to reset your password."
                )
              }
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="error-message">{error}</p>
          )}

          {info && (
            <p className="success-message">{info}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="login-button"
          >
            {submitting ? "Logging in..." : "Sign In"}
          </button>

        </form>

        <div className="login-footer">
          <p>
            {ownerMode
              ? "New to DineConnect?"
              : "Don't have an account?"}
          </p>

          <button
            type="button"
            onClick={onCreateAccount}
          >
            {ownerMode
              ? "Register Restaurant"
              : "Create Account"}
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="back-button"
        >
          Back
        </button>

      </div>
    </div>
  );
}

export default LoginPage;
