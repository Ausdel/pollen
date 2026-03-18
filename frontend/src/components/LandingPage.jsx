import { useNavigate } from "react-router-dom";
import styles from "../styles/LandingPage.module.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.landingPage}>
      <div className={styles.landingContent}>

        <div className={styles.landingLogo}>
          <span className={styles.logoIcon}>🐝</span>
          <h1 className={styles.appName}>Pollen</h1>
          <p className={styles.appTagline}>See what's buzzing.</p>
        </div>

        <div className={styles.landingButtons}>
          <button className={styles.btnPrimary} onClick={() => navigate("/login")}>
            Log In
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate("/register")}>
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
}

export default LandingPage;