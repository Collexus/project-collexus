"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import styles from "./admin.module.css";

export function AdminFlashToast({ message, tone }: { message: string; tone: "success" | "error" }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), tone === "error" ? 8000 : 5500);
    return () => window.clearTimeout(timeout);
  }, [tone]);

  if (!visible) return null;

  const Icon = tone === "error" ? CircleAlert : CheckCircle2;
  return (
    <div className={styles.toastViewport}>
      <div className={`${styles.toast} ${tone === "error" ? styles.toastError : styles.toastSuccess}`} role={tone === "error" ? "alert" : "status"} aria-live={tone === "error" ? "assertive" : "polite"}>
        <Icon className={styles.toastIcon} size={19} aria-hidden="true" />
        <p className={styles.toastText}>{message}</p>
        <button className={styles.toastClose} type="button" aria-label="Dismiss notification" onClick={() => setVisible(false)}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
