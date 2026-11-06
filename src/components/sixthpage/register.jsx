import { useState } from "react";
import "./login.css";
import { API_BASE_URL } from "../../config/api";

function RegistrationPage({ onBack, onSuccess, ownerMode = false }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    restaurantName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${ownerMode ? "register-owner" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          username: form.username,
          password: form.password,
          phone: form.phone,
          ...(ownerMode ? { restaurantName: form.restaurantName } : {}),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to create your account.");
        return;
      }

      if (ownerMode) {
        onSuccess(result.user);
        return;
      }

      setSuccess("Your account has been created. You can now return to the login page.");
      setForm({
        fullName: "Abigail",
        email: "abigail2006@gmail.com",
        username: "abigail2006",
        password: "29082006",
        confirmPassword: "29082006",
        phone: "0751650658",
      });
    } catch {
      setError("Unable to connect to the registration service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <button className="login-back-button" type="button" onClick={onBack}>
          ← Back to Login
        </button>

        <div className="login-form-wrap">
          <div className="login-logo">
          
            <b>Dine<span>Connect</span></b>
          </div>

          <h1 className="login-title">{ownerMode ? "Register your restaurant" : "Create an account"}</h1>
          <p className="login-subtitle">{ownerMode ? "Join the DineConnect restaurant portal" : "Join DineConnect"}</p>

          <form className="register-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="register-full-name">Full Name</label>
            <input
              className="login-input register-input"
              id="register-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={updateField}
              required
            />

            <label className="login-label" htmlFor="register-email">Email Address</label>
            <input
              className="login-input register-input"
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />

            <label className="login-label" htmlFor="register-username">Username</label>
            <input
              className="login-input register-input"
              id="register-username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={updateField}
              required
            />

            <label className="login-label" htmlFor="register-password">Password</label>
            <input
              className="login-input register-input"
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={updateField}
              minLength={8}
              required
            />

            <label className="login-label" htmlFor="register-confirm-password">Confirm Password</label>
            <input
              className="login-input register-input"
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={updateField}
              minLength={8}
              required
            />

            <label className="login-label" htmlFor="register-phone">Phone Number</label>
            <input
              className="login-input register-input"
              id="register-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={updateField}
              required
            />

            {ownerMode && (
              <>
                <label className="login-label" htmlFor="register-restaurant-name">Restaurant Name</label>
                <input
                  className="login-input register-input"
                  id="register-restaurant-name"
                  name="restaurantName"
                  type="text"
                  value={form.restaurantName}
                  onChange={updateField}
                  required
                />
              </>
            )}

            {error && <p className="login-error" role="alert">{error}</p>}
            {success && <p className="login-success" role="status">{success}</p>}

            <button className="login-green-button" type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create Account"}
            </button>
            <button className="login-create-button" type="button" onClick={onBack}>
              Back to Login
            </button>
          </form>
        </div>

        <p className="login-footer">© 2026 DineConnect · Restaurant management</p>
      </div>
    </div>
  );
}

export default RegistrationPage;
