
import { useState } from "react";
import "./login.css";

function LoginPage({
  onBack,
  onCreateAccount,
  onSuccess,
  customerMode = false,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  
  const handleLogin = (event) => {
    event.preventDefault();

    setError("");
    setInfo("");
    setSubmitting(true);

    if (
      username.trim() === "admin" &&
      password === "Admin123"
    ) {
      setInfo("Login successful!");

      onSuccess({
        id: "demo-admin",
        username: "admin",
        fullName: "Demo Admin",
        role: "admin",
      });

      setSubmitting(false);
    } else {
      setError("Invalid username or password.");
      setPassword("");
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1>DineConnect</h1>
        <p>RESTAURANT QR ORDERING</p>

        <h2>Welcome Back!</h2>
        <p>Please login to continue.</p>

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
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
                setInfo("Please contact the administrator to reset your password.")
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
          <p>Don't have an account?</p>

          <button
            type="button"
            onClick={onCreateAccount}
          >
            Create Account
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
