import { useState } from "react";

const storageKey = (userId) => `fitmi_welcome_seen_${userId}`;
const skipKey = (userId) => `fitmi_welcome_skip_date_${userId}`;

function BarIcon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ width: 14, height: 3, background: "#22c55e", borderRadius: 2 }} />
      <div style={{ width: 14, height: 3, background: "#22c55e", borderRadius: 2 }} />
      <div style={{ width: 9, height: 3, background: "#22c55e", borderRadius: 2 }} />
    </div>
  );
}

function CircleIcon() {
  return (
    <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #22c55e" }} />
  );
}

function PersonIcon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", marginBottom: 2 }} />
      <div style={{ width: 12, height: 6, borderRadius: "3px 3px 0 0", background: "#22c55e" }} />
    </div>
  );
}

function ChatIcon() {
  return (
    <div style={{ width: 14, height: 10, borderRadius: 3, border: "2px solid #22c55e" }} />
  );
}

const features = [
  {
    Icon: BarIcon,
    title: "Armate tu rutina",
    description: "Elegí los ejercicios de cada día y organizá tu semana a tu manera.",
  },
  {
    Icon: CircleIcon,
    title: "Generá una rutina con IA",
    description: "Contanos tus objetivos y te armamos una rutina personalizada.",
  },
  {
    Icon: PersonIcon,
    title: "Contactá a un entrenador",
    description: "Pedile a un profesional que te diseñe una rutina a medida.",
  },
  {
    Icon: ChatIcon,
    title: "Conectate con otros",
    description: "Seguí usuarios, mirá su progreso y chateá con la comunidad.",
  },
];

export default function WelcomePopup({ userName, userId }) {
  const [visible, setVisible] = useState(() => {
    if (!userId) return false;
    const seen = localStorage.getItem(storageKey(userId));
    const skip = localStorage.getItem(skipKey(userId));
    if (seen) return false;
    if (skip === new Date().toDateString()) return false;
    return true;
  });

  function handleClose() {
    localStorage.setItem(storageKey(userId), "true");
    setVisible(false);
  }

  function handleSkipToday() {
    localStorage.setItem(skipKey(userId), new Date().toDateString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.logo}>FITMI</div>
        <div style={styles.title}>Hola, {userName}!</div>
        <div style={styles.subtitle}>Esto es lo que podés hacer hoy en Fitmi:</div>

        <div style={styles.featureList}>
          {features.map(({ Icon, title, description }) => (
            <div key={title} style={styles.featureItem}>
              <div style={styles.iconBox}>
                <Icon />
              </div>
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>{title}</div>
                <div style={styles.featureDesc}>{description}</div>
              </div>
            </div>
          ))}
        </div>

        <button style={styles.button} onClick={handleClose}>
          Empezar
        </button>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
  },
  modal: {
    backgroundColor: "#0f0f0f",
    border: "1px solid #1a2a1a",
    borderRadius: "14px",
    padding: "20px",
    maxWidth: "340px",
    width: "100%",
  },
  logo: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#22c55e",
    letterSpacing: "2px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "12px",
    color: "#444",
    marginBottom: "14px",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "16px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "9px 10px",
    backgroundColor: "#0a0a0a",
    border: "1px solid #111",
    borderRadius: "7px",
  },
  iconBox: {
    width: "26px",
    height: "26px",
    borderRadius: "5px",
    backgroundColor: "#0a1a0a",
    border: "1px solid #1a3a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#fff",
    marginBottom: "1px",
  },
  featureDesc: {
    fontSize: "10px",
    color: "#444",
    lineHeight: "1.4",
  },
  button: {
    backgroundColor: "#22c55e",
    color: "#000",
    border: "none",
    padding: "10px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
  },
  skipLink: {
    textAlign: "center",
    marginTop: "8px",
    fontSize: "10px",
    color: "#333",
    cursor: "pointer",
  },
};
