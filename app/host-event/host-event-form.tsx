"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";
import styles from "./host-event.module.css";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const draftStorageKey = "collexus-host-event-draft-v1";

type FormState = {
  organizerName: string;
  occupation: string;
  institution: string;
  institutionOther: string;
  batch: string;
  email: string;
  phone: string;
  eventName: string;
  category: string;
  template: string;
  about: string;
  expectedParticipants: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  mode: string;
  venue: string;
  pricing: "free" | "paid";
  price: string;
};

const initialForm: FormState = {
  organizerName: "",
  occupation: "",
  institution: "",
  institutionOther: "",
  batch: "",
  email: "",
  phone: "",
  eventName: "",
  category: "",
  template: "",
  about: "",
  expectedParticipants: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  mode: "",
  venue: "",
  pricing: "free",
  price: "",
};

function isSavedForm(value: unknown): value is FormState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(initialForm);
  if (Object.keys(candidate).length !== keys.length || keys.some((key) => typeof candidate[key] !== "string")) return false;
  if (candidate.pricing !== "free" && candidate.pricing !== "paid") return false;
  if (candidate.expectedParticipants && (!/^\d+$/.test(candidate.expectedParticipants as string) || Number(candidate.expectedParticipants) < 1 || Number(candidate.expectedParticipants) > 100000)) return false;
  if (candidate.price && (!/^\d+(\.\d{1,2})?$/.test(candidate.price as string) || Number(candidate.price) < 1)) return false;
  return true;
}

const fieldTitles: Record<string, string> = {
  "1": "First year",
  "2": "Second year",
  "3": "Third year",
  "4": "Final year",
  "faculty": "Faculty & staff",
  "all": "All batches",
};

function formatDate(value: string) {
  if (!value) return "Date to be announced";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "Date to be announced"
    : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

export function HostEventForm() {
  const [form, setForm] = useState(initialForm);
  const [reviewed, setReviewed] = useState(false);
  const [dateError, setDateError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [posterPreview, setPosterPreview] = useState("");
  const [posterError, setPosterError] = useState("");

  useEffect(() => () => {
    if (posterPreview) URL.revokeObjectURL(posterPreview);
  }, [posterPreview]);

  function update<K extends keyof FormState>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.currentTarget.value;
      setForm((current) => ({ ...current, [key]: value }));
      setReviewed(false);
      setDateError("");
      setDraftStatus("");
    };
  }

  function scrollToPreview() {
    const preview = document.getElementById("event-listing-preview");
    preview?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    preview?.focus({ preventScroll: true });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startComplete = Boolean(form.startDate && form.startTime);
    const endComplete = Boolean(form.endDate && form.endTime);
    const startPartial = Boolean(form.startDate) !== Boolean(form.startTime);
    const endPartial = Boolean(form.endDate) !== Boolean(form.endTime);
    const startsAt = startComplete ? new Date(`${form.startDate}T${form.startTime}`) : null;
    const endsAt = endComplete ? new Date(`${form.endDate}T${form.endTime}`) : null;
    if (startPartial || endPartial) {
      setDateError("Add both a date and time for each event start or end.");
      document.getElementById(startPartial ? "host-start-date" : "host-end-date")?.focus();
      return;
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      setDateError("The end date and time must be after the start date and time.");
      document.getElementById("host-end-date")?.focus();
      return;
    }
    setDateError("");
    setReviewed(true);
    window.requestAnimationFrame(scrollToPreview);
  }

  function selectPoster(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setPosterError("");
    if (!file) {
      setPosterPreview("");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.currentTarget.value = "";
      setPosterError("Choose a JPG, PNG, or WebP image.");
      setPosterPreview("");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.currentTarget.value = "";
      setPosterError("Choose an image smaller than 5 MB.");
      setPosterPreview("");
      return;
    }
    setPosterPreview(URL.createObjectURL(file));
    setReviewed(false);
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), form }));
      setDraftStatus("Draft saved on this device.");
    } catch {
      setDraftStatus("Could not save the draft. Check this browser’s storage settings.");
    }
  }

  function restoreDraft() {
    try {
      const saved = window.localStorage.getItem(draftStorageKey);
      if (!saved) {
        setDraftStatus("No saved draft was found on this device.");
        return;
      }
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object" || !("version" in parsed) || !("form" in parsed)) throw new Error("Invalid draft");
      const record = parsed as { version: unknown; form: unknown };
      if (record.version !== 1 || !isSavedForm(record.form)) throw new Error("Invalid draft");
      setForm(record.form);
      setReviewed(false);
      setDateError("");
      setDraftStatus("Saved draft restored.");
    } catch {
      setDraftStatus("This saved draft could not be read. Clear it and start a new one.");
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(draftStorageKey);
      setDraftStatus("Saved draft cleared from this device.");
    } catch {
      setDraftStatus("Could not clear the saved draft in this browser.");
    }
  }

  function downloadSubmission() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      organizer: {
        name: form.organizerName,
        occupation: form.occupation,
        institution: form.institution === "Other institution" ? form.institutionOther : form.institution,
        batch: form.batch,
        email: form.email,
        phone: form.phone,
      },
      event: {
        name: form.eventName,
        category: form.category,
        template: form.template,
        description: form.about,
        expectedParticipants: form.expectedParticipants ? Number(form.expectedParticipants) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        mode: form.mode,
        venue: form.venue,
        pricing: form.pricing,
        price: form.pricing === "paid" ? Number(form.price) : 0,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.eventName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event-submission"}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const dates = form.startDate
    ? `${formatDate(form.startDate)}${form.endDate && form.endDate !== form.startDate ? ` – ${formatDate(form.endDate)}` : ""}`
    : "Dates to be announced";
  const selectedAudience = fieldTitles[form.batch] ?? "Choose an audience";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href={`${publicBasePath}/`} aria-label="Collexus home">
          <span className={styles.brandLogoFrame} aria-hidden="true"><img src={`${publicBasePath}/collexus-logo.svg`} alt="" /></span>
          <span>Collexus</span>
        </a>
        <a className={styles.backLink} href={`${publicBasePath}/#featured-events`}>
          <ArrowLeft aria-hidden="true" size={17} />
          <span>Back to events</span>
        </a>
      </header>

      <div className={styles.shell}>
        <div className={styles.intro}>
          <div className={styles.introCopy}>
            <div className={styles.eyebrow}>EVENT SUBMISSION</div>
            <h1 id="host-title">Put your event<br className={styles.desktopBreak} /> on the campus map.</h1>
            <p>Share the details with students and faculty. We’ll help make your event easy to find.</p>
            <div className={styles.introActions}>
              <div className={styles.formNote}><span>*</span> Required fields</div>
              <a className={styles.stallRegistrationLink} href={`${publicBasePath}/stall-registration/`}>
                <Store aria-hidden="true" size={16} />
                <span>Register a stall</span>
                <ArrowRight aria-hidden="true" size={15} />
              </a>
            </div>
          </div>
          <img className={styles.introIllustration} src={`${publicBasePath}/images/host-event-planning-illustration.png`} alt="Students planning a campus event together" />
        </div>

        <div className={styles.layout}>
          <form id="host-event-form" className={styles.form} onSubmit={handleSubmit}>
            <section className={styles.section} aria-labelledby="organizer-heading">
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>01</span>
                <div><h2 id="organizer-heading">Organizer details</h2><p>Who should we contact about this event?</p></div>
              </div>
              <div className={styles.fields}>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Your name <b aria-hidden="true">*</b></span>
                  <input autoComplete="name" name="organizerName" onChange={update("organizerName")} placeholder="e.g. Ananya Rao" required value={form.organizerName} />
                </label>
                <label className={styles.field}>
                  <span>Occupation <b aria-hidden="true">*</b></span>
                  <select name="occupation" onChange={update("occupation")} required value={form.occupation}>
                    <option value="" disabled hidden>Select occupation</option>
                    <option>Student</option><option>Faculty</option><option>Staff</option><option>Alumni</option><option>External organizer</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Institution <b aria-hidden="true">*</b></span>
                  <select name="institution" onChange={update("institution")} required value={form.institution}>
                    <option value="" disabled hidden>Select institution</option>
                    <option>Ramachandra College of Engineering</option><option>Other institution</option>
                  </select>
                </label>
                {form.institution === "Other institution" && <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Institution name <b aria-hidden="true">*</b></span>
                  <input autoComplete="organization" name="institutionOther" onChange={update("institutionOther")} placeholder="Enter your college or organization" required value={form.institutionOther} />
                </label>}
                <label className={styles.field}>
                  <span>Email address <b aria-hidden="true">*</b></span>
                  <input autoComplete="email" name="email" onChange={update("email")} placeholder="you@college.edu" required type="email" value={form.email} />
                </label>
                <label className={styles.field}>
                  <span>Phone number <b aria-hidden="true">*</b></span>
                  <input autoComplete="tel" inputMode="tel" name="phone" onChange={update("phone")} pattern="[+0-9() .-]{7,20}" placeholder="+91 98765 43210" required type="tel" value={form.phone} />
                  <small>Include your country code so we can reach you.</small>
                </label>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="event-heading">
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>02</span>
                <div><h2 id="event-heading">Event details</h2><p>Give your listing a clear name and description.</p></div>
              </div>
              <div className={styles.fields}>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Event name <b aria-hidden="true">*</b></span>
                  <input name="eventName" onChange={update("eventName")} placeholder="e.g. Campus Innovation Week" required value={form.eventName} />
                </label>
                <label className={styles.field}>
                  <span>Category <b aria-hidden="true">*</b></span>
                  <select name="category" onChange={update("category")} required value={form.category}>
                    <option value="" disabled hidden>Choose a category</option>
                    <option>Hackathon</option><option>Workshop</option><option>Project expo</option><option>Cultural event</option><option>Sports & outdoors</option><option>Career & internship</option><option>Branch event</option><option>Other</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Event template <b aria-hidden="true">*</b></span>
                  <select name="template" onChange={update("template")} required value={form.template}>
                    <option value="" disabled hidden>Select an event layout</option>
                    <option>Workshop or seminar</option><option>Hackathon or competition</option><option>Festival or cultural event</option><option>Sports meet</option><option>Project expo</option><option>General campus event</option>
                  </select>
                  <small>Pick a layout for the event listing preview.</small>
                </label>
                <label className={styles.field}>
                  <span>Eligible batch / audience <b aria-hidden="true">*</b></span>
                  <select name="batch" onChange={update("batch")} required value={form.batch}>
                    <option value="" disabled hidden>Select eligible audience</option>
                    <option value="1">First year</option><option value="2">Second year</option><option value="3">Third year</option><option value="4">Final year</option><option value="all">All batches</option><option value="faculty">Faculty &amp; staff</option>
                  </select>
                </label>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Brief about the event <b aria-hidden="true">*</b></span>
                  <textarea maxLength={600} name="about" onChange={update("about")} placeholder="What will participants do, learn, or experience?" required rows={4} value={form.about} />
                  <small className={styles.charCount}>{form.about.length}/600 characters</small>
                </label>
                <label className={`${styles.field} ${styles.spanTwo} ${styles.uploadField}`}>
                  <span>Event poster <small>(optional)</small></span>
                  <input accept="image/jpeg,image/png,image/webp" name="poster" onChange={selectPoster} type="file" />
                  <small>Upload a JPG, PNG, or WebP image (up to 5 MB). It appears in the preview on this device.</small>
                  {posterError && <small className={styles.formError} role="alert">{posterError}</small>}
                </label>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="schedule-heading">
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>03</span>
                <div><h2 id="schedule-heading">Schedule &amp; venue</h2><p>Let people know when and where to join.</p></div>
              </div>
              <div className={styles.fields}>
                <label className={styles.field}>
                  <span>From date <b aria-hidden="true">*</b></span>
                  <input id="host-start-date" name="startDate" onChange={update("startDate")} required type="date" value={form.startDate} />
                </label>
                <label className={styles.field}>
                  <span>To date <b aria-hidden="true">*</b></span>
                  <input id="host-end-date" min={form.startDate || undefined} name="endDate" onChange={update("endDate")} required type="date" value={form.endDate} />
                </label>
                <label className={styles.field}>
                  <span>Starting time <b aria-hidden="true">*</b></span>
                  <input name="startTime" onChange={update("startTime")} required type="time" value={form.startTime} />
                </label>
                <label className={styles.field}>
                  <span>Ending time <b aria-hidden="true">*</b></span>
                  <input name="endTime" onChange={update("endTime")} required type="time" value={form.endTime} />
                </label>
                {dateError && <p className={`${styles.formError} ${styles.spanTwo}`} role="alert">{dateError}</p>}
                <label className={styles.field}>
                  <span>Event format <b aria-hidden="true">*</b></span>
                  <select name="mode" onChange={update("mode")} required value={form.mode}>
                    <option value="" disabled hidden>Choose an event format</option><option>In person</option><option>Online</option><option>Hybrid</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Venue <b aria-hidden="true">*</b></span>
                  <input autoComplete="street-address" name="venue" onChange={update("venue")} placeholder={form.mode === "Online" ? "Meeting link shared after approval" : "Building, room, or campus area"} required value={form.venue} />
                </label>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Expected number of participants <b aria-hidden="true">*</b></span>
                  <input min="1" max="100000" name="expectedParticipants" onChange={update("expectedParticipants")} placeholder="e.g. 120" required type="number" value={form.expectedParticipants} />
                  <small>A rough estimate helps attendees understand the event size.</small>
                </label>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="pricing-heading">
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>04</span>
                <div><h2 id="pricing-heading">Entry &amp; pricing</h2><p>Set expectations before anyone signs up.</p></div>
              </div>
              <fieldset className={styles.pricingGroup}>
                <legend>Is the event free or paid? <b aria-hidden="true">*</b></legend>
                <div className={styles.priceChoices}>
                  <label className={`${styles.priceChoice} ${form.pricing === "free" ? styles.priceChoiceActive : ""}`}>
                    <input checked={form.pricing === "free"} name="pricing" onChange={() => { setForm((current) => ({ ...current, pricing: "free" })); setReviewed(false); }} type="radio" value="free" />
                    <span><strong>Free</strong><small>No ticket fee</small></span>
                    {form.pricing === "free" && <Check aria-hidden="true" size={17} />}
                  </label>
                  <label className={`${styles.priceChoice} ${form.pricing === "paid" ? styles.priceChoiceActive : ""}`}>
                    <input checked={form.pricing === "paid"} name="pricing" onChange={() => { setForm((current) => ({ ...current, pricing: "paid" })); setReviewed(false); }} type="radio" value="paid" />
                    <span><strong>Paid</strong><small>Show an entry price</small></span>
                    {form.pricing === "paid" && <Check aria-hidden="true" size={17} />}
                  </label>
                </div>
              </fieldset>
              {form.pricing === "paid" && <label className={`${styles.field} ${styles.priceField}`}>
                <span>Ticket price (₹) <b aria-hidden="true">*</b></span>
                <div className={styles.currencyInput}><span aria-hidden="true">₹</span><input min="1" name="price" onChange={update("price")} placeholder="0.00" required step="0.01" type="number" value={form.price} /></div>
              </label>}
              <p className={styles.pricingNote}>Ticketing and payment processing are not connected in this preview.</p>
            </section>

            <div className={styles.submitArea}>
              <p className={styles.reviewPrompt}><ShieldCheck aria-hidden="true" size={18} /><span><strong>Before you share:</strong> check the dates, venue, contact details, price, and poster in the preview. This page saves locally and exports a file; it does not publish events.</span></p>
              <button className={styles.submitButton} onClick={scrollToPreview} type="button"><Eye aria-hidden="true" size={18} /> Show live preview <ArrowRight aria-hidden="true" size={18} /></button>
              <div className={styles.draftActions}>
                <button className={styles.draftButton} onClick={saveDraft} type="button">Save draft on this device</button>
                <button className={styles.draftButton} onClick={restoreDraft} type="button">Restore saved draft</button>
                <button className={styles.draftButton} onClick={clearDraft} type="button">Clear saved draft</button>
              </div>
              <p>Your draft stays in this browser until you export it.</p>
              {draftStatus && <p className={styles.draftStatus} role="status">{draftStatus}</p>}
              {reviewed && <div className={styles.successMessage} role="status"><ShieldCheck aria-hidden="true" size={18} /><span>Required fields and date/time checks passed. Review the full preview below, then download the submission when you’re ready.</span></div>}
              {reviewed && <button className={styles.draftButton} onClick={downloadSubmission} type="button">Download event submission JSON</button>}
            </div>
          </form>

          <aside className={styles.sidebar} aria-label="Event listing preview">
            <div id="event-listing-preview" className={styles.previewCard} tabIndex={-1}>
              <div className={styles.previewTopline}><span>LIVE PREVIEW</span><span className={styles.previewDot} /> DRAFT</div>
              <div className={styles.previewArtwork}>
                {posterPreview ? <img className={styles.posterImage} src={posterPreview} alt="Uploaded event poster preview" /> : <div className={styles.previewPlaceholder} aria-hidden="true">
                  <span className={styles.artRingOne} /><span className={styles.artRingTwo} />
                  <Sparkles size={22} />
                  <span className={styles.artLabel}>COLLEXUS · CAMPUS EVENTS</span>
                </div>}
              </div>
              <div className={styles.previewContent}>
                <span className={styles.categoryBadge}>{form.category || "EVENT CATEGORY"}</span>
                <h2>{form.eventName || "Your event name"}</h2>
                <p>{form.about || "A short description of your event will appear here."}</p>
                <div className={styles.previewMeta}><CalendarDays aria-hidden="true" size={16} /><span>{dates}</span></div>
                <div className={styles.previewMeta}><Clock3 aria-hidden="true" size={16} /><span>{form.startTime || "Start time"}{form.endTime ? ` – ${form.endTime}` : ""}</span></div>
                <div className={styles.previewMeta}><MapPin aria-hidden="true" size={16} /><span>{form.venue || "Event venue"}</span></div>
                <div className={styles.previewMeta}><Building2 aria-hidden="true" size={16} /><span>{form.institution === "Other institution" ? form.institutionOther || "Your institution" : form.institution || "Institution"}</span></div>
                <div className={styles.previewMeta}><UsersRound aria-hidden="true" size={16} /><span>{form.expectedParticipants ? `Around ${form.expectedParticipants} participants` : "Participant estimate"}</span></div>
                <div className={styles.previewFooter}><span>{form.pricing === "paid" && form.price ? `₹${form.price}` : form.pricing === "paid" ? "Paid entry" : "Free entry"}</span><span>{form.template || "Event layout not selected"}</span></div>
                <div className={styles.previewAudience}>For: {selectedAudience}</div>
              </div>
            </div>
            <div className={styles.checklist}>
              <ShieldCheck aria-hidden="true" size={19} />
              <div><strong>What happens next?</strong><p>Review the event card, then export a JSON summary for your event team. Publishing is not connected on this page.</p></div>
            </div>
            <button className={styles.previewButton} onClick={() => document.querySelector<HTMLFormElement>("#host-event-form")?.requestSubmit()} type="button" aria-controls="host-event-form">
              <Send aria-hidden="true" size={17} /> Prepare submission <ArrowRight aria-hidden="true" size={16} />
            </button>
            <a className={styles.backToEvents} href={`${publicBasePath}/#featured-events`}><ArrowLeft aria-hidden="true" size={16} /> Explore published events</a>
          </aside>
        </div>
        <footer className={styles.footer}>© 2026 Collexus <span>Campus events, in one place.</span></footer>
      </div>
    </main>
  );
}
