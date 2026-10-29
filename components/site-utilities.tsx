"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronRight, Copy, HelpCircle, Menu, X } from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const trackingKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];

export function SiteUtilities() {
  const pathname = usePathname();
  const scrollProgressRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cookieVisible, setCookieVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";
    if (main && !main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    let scrollFrame = 0;
    const updateScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        scrollProgressRef.current?.style.setProperty("transform", `scaleX(${progress})`);
      });
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateScroll);
    resizeObserver?.observe(document.documentElement);
    if (document.body) resizeObserver?.observe(document.body);
    document.addEventListener("load", updateScroll, true);
    let navigationTimeout: number | undefined;

    try {
      const current = new URL(window.location.href);
      const tracking = new URLSearchParams();
      trackingKeys.forEach((key) => {
        const value = current.searchParams.get(key) || sessionStorage.getItem(`collexus:${key}`);
        if (value) {
          tracking.set(key, value);
          sessionStorage.setItem(`collexus:${key}`, value);
        }
      });
      if (tracking.size) sessionStorage.setItem("collexus:tracking", tracking.toString());
    } catch { /* Storage can be disabled; navigation still works without attribution. */ }

    try {
      setCookieVisible(localStorage.getItem("collexus_notice_acknowledged") !== "yes");
    } catch { setCookieVisible(true); }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash && url.pathname === window.location.pathname) return;
      try {
        const tracking = new URLSearchParams(sessionStorage.getItem("collexus:tracking") ?? "");
        tracking.forEach((value, key) => { if (!url.searchParams.has(key)) url.searchParams.set(key, value); });
        if (tracking.size) anchor.href = url.toString();
      } catch { /* Tracking is optional and must never block a link. */ }
      document.querySelector(".site-scroll-progress")?.setAttribute("data-loading", "true");
      window.clearTimeout(navigationTimeout);
      navigationTimeout = window.setTimeout(() => document.querySelector(".site-scroll-progress")?.removeAttribute("data-loading"), 10000);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      resizeObserver?.disconnect();
      document.removeEventListener("load", updateScroll, true);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(navigationTimeout);
    };
  }, []);

  useEffect(() => {
    document.querySelector(".site-scroll-progress")?.removeAttribute("data-loading");
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = document.querySelector<HTMLElement>(".site-menu-panel");
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    focusable()?.[0]?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = Array.from(focusable() ?? []);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      previous?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const input = document.createElement("textarea");
      input.value = window.location.href;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      const success = document.execCommand("copy");
      input.remove();
      setCopied(success);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  function dismissNotice() {
    setCookieVisible(false);
    try { localStorage.setItem("collexus_notice_acknowledged", "yes"); } catch { /* Dismiss for this visit. */ }
  }

  return (
    <>
      <a className="site-skip-link" href="#main-content" onClick={() => document.querySelector("main")?.focus({ preventScroll: true })}>Skip to content</a>
      <div className="site-scroll-progress" aria-hidden="true"><span ref={scrollProgressRef} /></div>
      <div className="site-utility-actions" aria-label="Page utilities">
        <button className="site-float-button site-help-button" type="button" aria-label="Open help and site menu" title="Help and site menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><HelpCircle size={20} aria-hidden="true" /></button>
      </div>

      {menuOpen && <div className="site-menu-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
        <section className="site-menu-panel" role="dialog" aria-modal="true" aria-labelledby="site-menu-title">
          <div className="site-menu-heading"><div><p>COLLEXUS</p><h2 id="site-menu-title">Explore &amp; get help</h2></div><button className="site-menu-close" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></button></div>
          <nav className="site-menu-links" aria-label="Site navigation">
            <a href={`${basePath}/#home`} onClick={() => setMenuOpen(false)}>Discover events <ChevronRight size={17} /></a>
            <a href={`${basePath}/#faq`} onClick={() => setMenuOpen(false)}>Frequently asked questions <ChevronRight size={17} /></a>
            <a href={`${basePath}/about-you/`} onClick={() => setMenuOpen(false)}>About you <ChevronRight size={17} /></a>
            <a href={`${basePath}/host-event/`} onClick={() => setMenuOpen(false)}>Host an event <ChevronRight size={17} /></a>
            <a href={`${basePath}/stall-registration/`} onClick={() => setMenuOpen(false)}>Register a stall <ChevronRight size={17} /></a>
            <a href={`${basePath}/login/`} onClick={() => setMenuOpen(false)}>Sign in <ChevronRight size={17} /></a>
          </nav>
          <div className="site-menu-footer"><p><HelpCircle size={16} /> Need a quick reference? Open the FAQ or copy this page link to share it.</p><button className="site-copy-button" type="button" onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Link copied" : "Copy page link"}</button><small className="site-updated-date">Site updated 19 October 2026</small></div>
        </section>
      </div>}

      {cookieVisible && <aside className="site-cookie-note" aria-label="Browser storage notice"><div><strong>Privacy note</strong><p>Collexus uses essential browser storage to remember local form drafts. Your display starts in day mode when you open the site. It does not use advertising cookies.</p></div><button type="button" onClick={dismissNotice} aria-label="Dismiss privacy notice">Got it</button></aside>}
    </>
  );
}
