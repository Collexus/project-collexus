"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import styles from "./login.module.css";

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type TurnstileRenderOptions = {
  sitekey: string;
  theme: "auto";
  size: "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileChallengeProps = {
  errorMessage: string;
  onError: (message: string) => void;
  onToken: (token: string) => void;
  resetKey: number;
  tokenReady: boolean;
};

export function TurnstileChallenge({
  errorMessage,
  onError,
  onToken,
  resetKey,
  tokenReady,
}: TurnstileChallengeProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey || !scriptReady) return;

    const turnstile = window.turnstile;
    const container = containerRef.current;
    if (!turnstile || !container) {
      onError("Cloudflare security verification could not load. Refresh the page and try again.");
      return;
    }

    let widgetId: string;
    try {
      widgetId = turnstile.render(container, {
        sitekey: turnstileSiteKey,
        theme: "auto",
        size: "flexible",
        callback: (token) => {
          onToken(token);
          onError("");
        },
        "expired-callback": () => {
          onToken("");
          onError("The security check expired. Complete it again.");
          if (widgetIdRef.current) turnstile.reset(widgetIdRef.current);
        },
        "error-callback": () => {
          onToken("");
          onError("Cloudflare security verification could not load. Refresh the page and try again.");
        },
      });
    } catch {
      onError("Cloudflare security verification could not start. Refresh the page and try again.");
      return;
    }

    widgetIdRef.current = widgetId;
    setWidgetReady(true);
    onError("");

    return () => {
      setWidgetReady(false);
      onToken("");
      if (widgetIdRef.current === widgetId) {
        turnstile.remove(widgetId);
        widgetIdRef.current = null;
      }
    };
  }, [onError, onToken, resetKey, scriptReady]);

  return (
    <div className={styles.captchaWrap}>
      <span className={styles.captchaLabel}>Security check</span>
      {turnstileSiteKey ? (
        <>
          <Script
            id="cloudflare-turnstile"
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onError={() => onError("Cloudflare security verification could not load. Check your connection and refresh the page.")}
            onReady={() => setScriptReady(true)}
          />
          <div aria-label="Cloudflare security verification" className={styles.captchaWidget} ref={containerRef} />
          <p aria-live="polite" className={styles.captchaStatus} role="status">
            {errorMessage || (tokenReady ? "Security check complete." : widgetReady ? "Complete the security check to continue." : "Loading security check…")}
          </p>
        </>
      ) : (
        <p className={styles.captchaUnavailable} role="status">
          Security verification is unavailable right now. Please contact the Collexus team.
        </p>
      )}
    </div>
  );
}
