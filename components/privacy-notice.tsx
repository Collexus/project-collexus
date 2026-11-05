"use client";

import { useEffect, useState } from "react";

const storageNoticeKey = "collexus_notice_acknowledged";

export function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Read browser storage after hydration to keep server and client markup consistent.
      setVisible(localStorage.getItem(storageNoticeKey) !== "yes");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismissNotice() {
    setVisible(false);
    try {
      localStorage.setItem(storageNoticeKey, "yes");
    } catch {
      // Dismiss for this visit when browser storage is unavailable.
    }
  }

  if (!visible) return null;

  return (
    <aside className="site-cookie-note" aria-label="Browser storage notice">
      <div>
        <strong>Privacy note</strong>
        <p>Collexus uses browser storage to remember local form drafts. Your display starts in day mode when you open the site. It does not use advertising cookies.</p>
      </div>
      <button type="button" onClick={dismissNotice} aria-label="Dismiss privacy notice">Got it</button>
    </aside>
  );
}
