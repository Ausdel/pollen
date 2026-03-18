import { useState } from "react";
import styles from "../styles/Auth.module.css";

const API_BASE = "http://localhost:8000";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Registration failed. Please try again.");
        return;
      }

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => { window.location.href = "/login"; }, 1800);
    } catch {
      setError("Could not connect to the server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <span className={styles.authIcon}>🍯</span>
          <h1 className={styles.authTitle}>Join the Hive</h1>
          <p className={styles.authSubtitle}>Create your account to start buzzing</p>
        </div>

        {error && <p className={styles.formError}>{error}</p>}
        {success && <p className={styles.formSuccess}>{success}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="username">Username</label>
            <input id="username" type="text" name="username" value={form.username}
              onChange={handleChange} placeholder="e.g. honeybee99" required />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Min. 8 characters" required />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" name="confirmPassword"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Repeat your password" required />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating account..." : "Create Account 🐝"}
          </button>
        </form>

        <hr className={styles.divider} />
        <p className={styles.authFooter}>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
