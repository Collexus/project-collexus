"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import QRCode from "qrcode";
import { nanoid } from "nanoid";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, CircleAlert, Download, MapPin, Share2, TicketCheck, UserRound } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import { confirmationStorageKey, type ConfirmationDraft, type ConfirmationKind } from "@/lib/confirmation";
import styles from "./confirmation.module.css";

const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
type PassPerson = { name: string; image?: string; reference: string };

const labels: Record<ConfirmationKind, { badge: string; title: string; eyebrow: string; copy: string; icon: string }> = {
  event: { badge: "REGISTRATION PREVIEW", title: "Your event details are ready", eyebrow: "EVENT REGISTRATION", copy: "Your event registration preview is ready to review.", icon: "EVENT" },
  fest: { badge: "FEST PASS PREVIEW", title: "Your fest pass preview is ready", eyebrow: "FEST REGISTRATION", copy: "Your fest pass preview is ready to review.", icon: "FEST" },
  order: { badge: "ORDER PREVIEW", title: "Your order summary is ready", eyebrow: "CAMPUS ORDER", copy: "Review the items and order total from your checkout preview.", icon: "ORDER" },
  host: { badge: "SUBMITTED FOR REVIEW", title: "Your event is with our team", eyebrow: "HOST AN EVENT", copy: "Your event submission reached Collexus and is waiting for review.", icon: "HOST" },
  stall: { badge: "STALL REQUEST DRAFT", title: "Your stall request is ready", eyebrow: "STALL REGISTRATION", copy: "Your stall request details are ready to review and share with the event team.", icon: "STALL" },
};

function noteFor(draft: ConfirmationDraft) {
  if (draft.kind === "host" && draft.status === "submitted") return "This confirms your submission was received for review. It does not mean your event is approved or published.";
  if (draft.kind === "stall") return "This is a request draft only. No stall has been reserved or approved.";
  if (draft.kind === "order") return "Checkout is a preview. No order was placed and no payment was collected.";
  return "This is a no-charge registration preview. It does not register you, reserve a place, or grant event entry.";
}

export function ConfirmationExperience() {
  const [draft, setDraft] = useState<ConfirmationDraft | null>(null);
  const [qrData, setQrData] = useState("");
  const [participantQrData, setParticipantQrData] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let next: ConfirmationDraft | null = null;
      try {
        const parsed = JSON.parse(window.sessionStorage.getItem(confirmationStorageKey) ?? "null") as ConfirmationDraft | null;
        if (parsed && parsed.reference && parsed.title && parsed.name && ["event", "fest", "order", "host", "stall"].includes(parsed.kind)) next = parsed;
      } catch { next = null; }
      if (!next && new URLSearchParams(window.location.search).get("preview") === "fest") {
        const reference = `CX-${nanoid(12).toUpperCase()}`;
        next = {
          kind: "fest",
          status: "preview",
          reference,
          createdAt: new Date().toISOString(),
          name: "Sara Student",
          email: "sara@example.edu",
          collegeId: "RCEE-26-018",
          image: "/assets/unique_sources/student_portrait.png",
          title: "Kreya ’26 Cultural Fest",
          subtitle: "Participant pass preview",
          date: "14 November 2026",
          location: "RCEE Campus",
          participants: [{ name: "Sara Student", image: "/assets/unique_sources/student_portrait.png", reference }],
        };
      }
      setDraft(next);
      if (next) void QRCode.toDataURL(`COLLEXUS|${next.kind.toUpperCase()}|${next.reference}`, { width: 320, margin: 2, errorCorrectionLevel: "H", color: { dark: "#102e37", light: "#ffffff" } }).then(setQrData).catch(() => setMessage("The reference is ready, but its QR image could not be generated."));
      if (next?.participants?.length) {
        void Promise.all(next.participants.filter((person) => person.reference !== next?.reference).map(async (person) => [person.reference, await QRCode.toDataURL(`COLLEXUS|${next?.kind.toUpperCase()}|${person.reference}`, { width: 180, margin: 2, errorCorrectionLevel: "H", color: { dark: "#102e37", light: "#ffffff" } })] as const)).then((codes) => setParticipantQrData(Object.fromEntries(codes))).catch(() => setMessage("One or more guest QR references could not be prepared."));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function makePassImage(person: PassPerson = { name: draft?.name ?? "", image: draft?.image, reference: draft?.reference ?? "" }, code = qrData) {
    if (!draft || !code) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1260;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#edf5f4";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(40, 40, 920, 1180, 42);
    context.fill();
    const header = context.createLinearGradient(40, 40, 960, 280);
    header.addColorStop(0, "#087e83");
    header.addColorStop(1, "#176c95");
    context.fillStyle = header;
    context.beginPath();
    context.roundRect(40, 40, 920, 270, 42);
    context.fill();
    context.fillStyle = "#b8fff1";
    context.font = "700 22px Arial";
    context.fillText(`COLLEXUS  /  ${labels[draft.kind].eyebrow}`, 90, 104);
    context.fillStyle = "#ffffff";
    context.font = "700 44px Arial";
    context.fillText(draft.title.slice(0, 34), 90, 174);
    context.font = "400 25px Arial";
    context.fillText(person.name.slice(0, 38), 90, 225);
    if (person.image) {
      let avatarSource = person.image;
      let avatarObjectUrl = "";
      if (!avatarSource.startsWith("data:image/")) {
        try {
          const response = await fetch(avatarSource);
          if (response.ok) {
            avatarObjectUrl = URL.createObjectURL(await response.blob());
            avatarSource = avatarObjectUrl;
          } else avatarSource = "";
        } catch { avatarSource = ""; }
      }
      if (avatarSource) {
      const avatar = new Image();
      avatar.src = avatarSource;
      await new Promise<void>((resolve) => { avatar.onload = () => resolve(); avatar.onerror = () => resolve(); });
      if (avatar.complete && avatar.naturalWidth) {
        context.save();
        context.beginPath();
        context.arc(850, 178, 74, 0, Math.PI * 2);
        context.clip();
        context.drawImage(avatar, 776, 104, 148, 148);
        context.restore();
      }
      }
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    }

    context.fillStyle = "#173744";
    context.font = "700 35px Arial";
    context.fillText(draft.subtitle ?? draft.title, 90, 385, 820);
    context.font = "400 25px Arial";
    context.fillStyle = "#54717a";
    if (draft.date) context.fillText(`Date  ·  ${draft.date}`, 90, 445, 820);
    if (draft.location) context.fillText(`Venue  ·  ${draft.location}`, 90, 495, 820);
    context.font = "700 20px Arial";
    context.fillStyle = "#087e83";
    context.fillText(labels[draft.kind].badge, 90, 555);
    context.fillStyle = "#173744";
    context.font = "400 22px Arial";
    context.fillText(`Reference  ${person.reference}`, 90, 610, 820);

    const qr = new Image();
    qr.src = code;
    await new Promise<void>((resolve) => { qr.onload = () => resolve(); qr.onerror = () => resolve(); });
    if (qr.complete && qr.naturalWidth) context.drawImage(qr, 340, 660, 320, 320);
    context.fillStyle = "#54717a";
    context.font = "400 19px Arial";
    context.textAlign = "center";
    context.fillText(noteFor(draft), 500, 1040, 780);
    context.fillStyle = "#789098";
    context.font = "400 17px Arial";
    context.fillText("Keep this preview with your Collexus details", 500, 1125, 820);
    context.fillStyle = "#087e83";
    context.font = "700 18px Arial";
    context.fillText("Questions?  hello@collexus.in", 500, 1175, 820);
    context.textAlign = "start";
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  const mainParticipant = draft?.participants?.find((person) => person.reference === draft.reference) ?? (draft ? { name: draft.name, image: draft.image, reference: draft.reference } : null);

  async function downloadPass(person: PassPerson | null = mainParticipant) {
    if (!draft) return;
    setBusy(true);
    const code = person?.reference === draft.reference ? qrData : person ? participantQrData[person.reference] : "";
    const blob = person ? await makePassImage(person, code) : null;
    setBusy(false);
    if (!blob) { setMessage("Could not prepare the pass image. Try again."); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collexus-${draft.kind}-preview-${person?.reference ?? draft.reference}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Your pass image was downloaded.");
  }

  async function sharePass(person: PassPerson | null = mainParticipant) {
    if (!draft || !person) return;
    setBusy(true);
    const code = person.reference === draft.reference ? qrData : participantQrData[person.reference];
    const blob = await makePassImage(person, code);
    setBusy(false);
    if (!blob) { setMessage("Could not prepare the pass image. Try again."); return; }
    const file = new File([blob], `collexus-${draft.kind}-${person.reference}.png`, { type: "image/png" });
    const text = `${labels[draft.kind].badge}: ${draft.title} · ${person.name} · Reference ${person.reference}. ${noteFor(draft)}`;
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: labels[draft.kind].badge, text, files: [file] });
      else if (navigator.share) await navigator.share({ title: labels[draft.kind].badge, text });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); setMessage("Confirmation details copied to your clipboard."); }
      else setMessage("Sharing is not available in this browser. Download the pass image instead.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Could not open the share menu. Download the pass image instead.");
    }
  }

  const kind = draft?.kind ?? "event";
  const copy = labels[kind];

  return (
    <ContentPage active="" eyebrow={draft ? copy.eyebrow : "YOUR CONFIRMATION"} title={draft ? <>A little <em className={styles.accent}>something</em> to keep.</> : <>Your activity, <em className={styles.accent}>together.</em></>} description={draft ? copy.copy : "Confirmation details are kept in the browser session that created them."} illustration={<svg viewBox="0 0 300 220" role="img" aria-label="A digital campus pass with a QR code"><defs><linearGradient id="pass-art" x1="0" x2="1"><stop stopColor="#c9f6ee"/><stop offset="1" stopColor="#e9edff"/></linearGradient></defs><rect x="8" y="8" width="284" height="204" rx="28" fill="url(#pass-art)"/><rect x="54" y="37" width="192" height="146" rx="18" fill="#fff"/><rect x="73" y="57" width="78" height="78" rx="8" fill="#e8f5f3"/><path d="M82 66h19v19H82zm38 0h19v19h-19zM82 104h19v19H82zm35 7h8m9 11h6m-24-38h8m-8 13h19" fill="#087e83"/><path d="M166 68h54m-54 16h42m-42 25h48m-48 15h34" stroke="#9ab7bb" strokeWidth="6" strokeLinecap="round"/><path d="M83 157h137" stroke="#d6e7e8" strokeWidth="3" strokeDasharray="5 7"/><circle cx="150" cy="157" r="7" fill="#edf5f4"/></svg>}>
      <section className={styles.confirmationShell} aria-live="polite">
        {!draft ? <div className={styles.emptyState}><span className={styles.emptyIcon}><TicketCheck size={24} /></span><h2>No confirmation to show yet</h2><p>Start from an event registration, your cart, or a request form. The confirmation page opens after that flow creates its summary.</p><Link className={styles.secondaryButton} href="/#featured-events"><ArrowLeft size={16} /> Browse events</Link></div> : <>
          <div className={styles.statusBar}><span className={styles.statusIcon}><BadgeCheck size={19} /></span><div><strong>{copy.badge}</strong><span>{draft.createdAt ? new Date(draft.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Just now"}</span></div><span className={styles.statusRef}>REF · {draft.reference}</span></div>
          <div className={styles.confirmationGrid}>
            <article className={styles.passCard}>
              <div className={styles.passHeader}><span className={styles.passEyebrow}><i /> {copy.eyebrow}</span><span className={styles.passType}>{copy.icon}</span><h2>{draft.title}</h2><p>{draft.subtitle ?? draft.name}</p></div>
              <div className={styles.passBody}>
                <div className={styles.attendeeRow}><span className={styles.avatar}>{draft.image ? <NextImage src={draft.image} alt={`${draft.name}'s profile`} width={54} height={54} unoptimized /> : <span>{draft.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>}</span><div><small>MADE FOR</small><strong>{draft.name}</strong><span>{draft.collegeId ? `College ID · ${draft.collegeId}` : draft.email ?? "Collexus member"}</span></div><UserRound size={18} aria-hidden="true" /></div>
                <div className={styles.passMeta}>{draft.date && <span><CalendarDays size={15} />{draft.date}</span>}{draft.location && <span><MapPin size={15} />{draft.location}</span>}{draft.phone && <span>{draft.phone}</span>}</div>
                {draft.people?.length ? <div className={styles.guestBlock}><strong>Also included</strong><span>{draft.people.join(" · ")}</span></div> : null}
                {draft.items?.length ? <div className={styles.orderItems}><strong>Items <span>{draft.items.reduce((sum, item) => sum + item.quantity, 0)}</span></strong>{draft.items.map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name} <small>× {item.quantity}</small></span><b>{money(item.total)}</b></div>)}{draft.pricing && <><div><span>Items subtotal</span><b>{money(draft.pricing.subtotal)}</b></div>{draft.pricing.discount > 0 && <div><span>Coupon discount</span><b>−{money(draft.pricing.discount)}</b></div>}<div><span>Platform fee (0.5%)</span><b>{money(draft.pricing.platformFee)}</b></div><div><span>Payment gateway + GST</span><b>{money(draft.pricing.gatewayFeeWithGst)}</b></div></>}{typeof draft.amount === "number" && <div className={styles.orderTotal}><span>Preview total</span><b>{money(draft.amount)}</b></div>}</div> : typeof draft.amount === "number" && <div className={styles.amount}><span>{draft.kind === "host" ? "Proposed ticket price" : "Amount"}</span><strong>{money(draft.amount)}</strong></div>}
                <div className={styles.passFooter}><span>UNIQUE REFERENCE</span><strong>{draft.reference}</strong></div>
              </div>
            </article>
            <aside className={styles.qrPanel}>
              <div className={styles.qrHeading}><span>YOUR QR REFERENCE</span><strong>{draft.kind === "event" || draft.kind === "fest" ? "Scan-ready preview" : "Reference code"}</strong></div>
              <div className={styles.qrFrame}>{qrData ? <NextImage src={qrData} alt={`Unique QR reference ${draft.reference}`} width={320} height={320} unoptimized /> : <span className={styles.qrLoading}>Preparing QR…</span>}</div>
              <p>Reference <strong>{draft.reference}</strong></p>
              <div className={styles.actionGroup}><button className={styles.primaryButton} type="button" onClick={() => downloadPass()} disabled={!qrData || busy}><Download size={17} />{busy ? "Preparing…" : "Download pass image"}</button><button className={styles.secondaryButton} type="button" onClick={() => sharePass()} disabled={!qrData || busy}><Share2 size={17} />Share details</button></div>
              {message && <p className={styles.actionMessage} role="status">{message}</p>}
              <p className={styles.privacyNote}><CircleAlert size={15} /> This QR contains a unique reference only. It is not validated for event entry or order pickup.</p>
            </aside>
          </div>
          {draft.participants && draft.participants.filter((person) => person.reference !== draft.reference).length > 0 && <section className={styles.participantSection} aria-labelledby="guest-passes-title"><div className={styles.participantHeading}><div><span>PERSONALIZED GUEST PASSES</span><h2 id="guest-passes-title">One pass for each guest</h2></div><small>Each person has a separate photo and QR reference.</small></div><div className={styles.participantGrid}>{draft.participants.filter((person) => person.reference !== draft.reference).map((person) => <article className={styles.participantCard} key={person.reference}><span className={styles.participantAvatar}>{person.image ? <NextImage src={person.image} alt={`${person.name}'s profile`} width={48} height={48} unoptimized /> : person.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><div className={styles.participantIdentity}><small>GUEST PASS</small><strong>{person.name}</strong><span>{person.reference}</span></div><div className={styles.participantQr}>{participantQrData[person.reference] ? <NextImage src={participantQrData[person.reference]} alt={`Unique QR reference for ${person.name}`} width={92} height={92} unoptimized /> : <span>QR</span>}</div><div className={styles.participantActions}><button type="button" className={styles.primaryButton} disabled={!participantQrData[person.reference] || busy} onClick={() => downloadPass(person)}><Download size={14} />Download pass</button><button type="button" className={styles.secondaryButton} disabled={!participantQrData[person.reference] || busy} onClick={() => sharePass(person)}><Share2 size={14} />Share</button></div></article>)}</div></section>}
          <div className={styles.notice}><CircleAlert size={18} /><p>{noteFor(draft)}</p></div>
          <p className={styles.contactLine}>Need help with these details? <a href="mailto:hello@collexus.in">hello@collexus.in</a></p>
          <div className={styles.bottomActions}><Link href="/registrations/" className={styles.secondaryButton}>View activity <ArrowRight size={16} /></Link><Link href="/#featured-events" className={styles.textLink}>Explore more events <ArrowRight size={16} /></Link></div>
        </>}
      </section>
    </ContentPage>
  );
}
