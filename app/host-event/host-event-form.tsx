"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import styles from "./host-event.module.css";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import { getSupabaseClient } from "@/lib/supabase-client";
import { getUserProfile } from "@/lib/user-profile";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const draftStorageKey = "collexus-host-event-draft-v1";
type CollexusPackage = { plan: "normal" | "pro" | ""; addons: string[]; listingName: string };

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
  duration: string;
  customDurationHours: string;
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
  duration: "",
  customDurationHours: "",
  mode: "",
  venue: "",
  pricing: "free",
  price: "",
};

function isSavedForm(value: unknown): value is FormState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  // Accept drafts saved before the duration field was added.
  if (candidate.duration === undefined) candidate.duration = "";
  if (candidate.customDurationHours === undefined) candidate.customDurationHours = "";
  const keys = Object.keys(initialForm);
  if (Object.keys(candidate).length !== keys.length || keys.some((key) => typeof candidate[key] !== "string")) return false;
  if (candidate.pricing !== "free" && candidate.pricing !== "paid") return false;
  if (candidate.expectedParticipants && (!/^\d+$/.test(candidate.expectedParticipants as string) || Number(candidate.expectedParticipants) < 1 || Number(candidate.expectedParticipants) > 100000)) return false;
  if (candidate.price && (!/^\d+(\.\d{1,2})?$/.test(candidate.price as string) || Number(candidate.price) < 1)) return false;
  if (candidate.customDurationHours && (!/^\d+(\.\d{1,2})?$/.test(candidate.customDurationHours as string) || Number(candidate.customDurationHours) < 1 || Number(candidate.customDurationHours) > 168)) return false;
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

function createSubmission(form: FormState, posterPath: string | null = null) {
  return {
    schemaVersion: 1,
    organizer: {
      name: form.organizerName.trim(),
      occupation: form.occupation,
      institution: form.institution === "Other institution" ? form.institutionOther.trim() : form.institution,
      batch: form.batch,
      email: form.email.trim(),
      phone: form.phone.trim(),
    },
    event: {
      name: form.eventName.trim(),
      category: form.category,
      template: form.template,
      description: form.about.trim(),
      expectedParticipants: form.expectedParticipants ? Number(form.expectedParticipants) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      duration: form.duration,
      customDurationHours: form.duration === "custom" && form.customDurationHours ? Number(form.customDurationHours) : null,
      mode: form.mode,
      venue: form.venue.trim(),
      pricing: form.pricing,
      price: form.pricing === "paid" ? Number(form.price) : 0,
      posterPath,
    },
  };
}

export function HostEventForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [collexusPackage, setCollexusPackage] = useState<CollexusPackage>({ plan: "", addons: [], listingName: "" });
  const [reviewed, setReviewed] = useState(false);
  const [dateError, setDateError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [posterPreview, setPosterPreview] = useState("");
  const [selectedPoster, setSelectedPoster] = useState<File | null>(null);
  const [posterError, setPosterError] = useState("");
  const [profileStatus, setProfileStatus] = useState("Loading your account details…");
  const lockedContactRef = useRef<Partial<FormState>>({});

  useEffect(() => {
    let active = true;
    async function loadContactDetails() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setProfileStatus("Sign in to load your contact details from your Collexus profile.");
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        setProfileStatus("Sign in to load your contact details from your Collexus profile.");
        return;
      }

      const user = data.user;
      const metadata = user.user_metadata ?? {};
      const { profile } = await getUserProfile(supabase, user.id);
      if (!active) return;
      const accountType = profile?.account_type ?? String(metadata.account_type ?? "student");
      const occupation = accountType === "faculty" ? "Faculty" : accountType === "guest" ? "External organizer" : "Student";
      const organization = profile?.profile_organization ?? String(metadata.institution ?? metadata.organization ?? "");
      const contact: Partial<FormState> = {
        organizerName: profile?.full_name ?? String(metadata.full_name ?? metadata.name ?? ""),
        occupation,
        institution: organization === "Ramachandra College of Engineering" ? organization : organization ? "Other institution" : "",
        institutionOther: organization && organization !== "Ramachandra College of Engineering" ? organization : "",
        email: user.email ?? "",
        phone: user.phone_confirmed_at && user.phone ? user.phone : profile?.profile_phone ?? String(metadata.phone_number ?? user.phone ?? ""),
      };
      lockedContactRef.current = contact;
      setForm((current) => ({ ...current, ...contact }));
      setProfileStatus("Contact details loaded from your profile. Update them in your account profile; they’re read-only here.");
    }
    void loadContactDetails();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const listingName = params.get("listingName") ?? "";
    const animation = window.requestAnimationFrame(() => {
      if (plan === "normal" || plan === "pro") restoreDraft();
      setCollexusPackage({ plan: plan === "normal" || plan === "pro" ? plan : "", addons: (params.get("addons") ?? "").split(",").filter(Boolean), listingName });
      if (listingName) setForm((current) => ({ ...current, eventName: listingName }));
    });
    return () => window.cancelAnimationFrame(animation);
  }, []);

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
    setReviewed(false);
    if (!file) {
      setSelectedPoster(null);
      setPosterPreview("");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.currentTarget.value = "";
      setSelectedPoster(null);
      setPosterError("Choose a JPG, PNG, or WebP image.");
      setPosterPreview("");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.currentTarget.value = "";
      setSelectedPoster(null);
      setPosterError("Choose an image smaller than 5 MB.");
      setPosterPreview("");
      return;
    }
    setSelectedPoster(file);
    setPosterPreview(URL.createObjectURL(file));
    setReviewed(false);
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), form, collexusPackage }));
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
      const record = parsed as { version: unknown; form: unknown; collexusPackage?: unknown };
      if (record.version !== 1 || !isSavedForm(record.form)) throw new Error("Invalid draft");
      setForm({ ...record.form, ...lockedContactRef.current });
      if (record.collexusPackage && typeof record.collexusPackage === "object") setCollexusPackage(record.collexusPackage as CollexusPackage);
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
      ...createSubmission(form),
      collexusPackage,
      posterFileName: selectedPoster?.name ?? "",
      posterNote: selectedPoster ? "Attach the selected poster image file separately when sharing this request." : "",
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.eventName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event-submission"}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function continueToHostPayment() {
    saveDraft();
    const params = new URLSearchParams({ requestType: "event", listingName: form.eventName.trim() });
    router.push(`${publicBasePath}/host/?${params.toString()}`);
  }

  const dates = form.startDate
    ? `${formatDate(form.startDate)}${form.endDate && form.endDate !== form.startDate ? ` – ${formatDate(form.endDate)}` : ""}`
    : "Dates to be announced";
  const selectedAudience = fieldTitles[form.batch] ?? "Choose an audience";
  const durationLabel = form.duration === "custom" && form.customDurationHours
    ? `${form.customDurationHours} hours`
    : ({ under_8_hours: "Less than 8 hours", "8_hours": "8 hours", "12_hours": "12 hours", "24_hours": "24 hours" } as Record<string, string>)[form.duration] ?? "Choose an event duration";

  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href={`${publicBasePath}/`} aria-label="Collexus home">
          <CollexusHomeLogo basePath={publicBasePath} />
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
              {collexusPackage.plan && <div className={styles.formNote}>Collexus {collexusPackage.plan === "pro" ? "Pro" : "Normal"} · {collexusPackage.addons.length} add-on{collexusPackage.addons.length === 1 ? "" : "s"} selected</div>}
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
                  <input autoComplete="name" name="organizerName" placeholder="Sign in to load your profile" readOnly required value={form.organizerName} />
                </label>
                <label className={styles.field}>
                  <span>Occupation <b aria-hidden="true">*</b></span>
                  <input autoComplete="organization-title" name="occupation" placeholder="From your account type" readOnly required value={form.occupation} />
                </label>
                <label className={styles.field}>
                  <span>Institution <b aria-hidden="true">*</b></span>
                  <input autoComplete="organization" name="institution" placeholder="From your account profile" readOnly required value={form.institution === "Other institution" ? form.institutionOther : form.institution} />
                </label>
                <label className={styles.field}>
                  <span>Email address <b aria-hidden="true">*</b></span>
                  <input autoComplete="email" name="email" placeholder="Email from your account" readOnly required type="email" value={form.email} />
                </label>
                <label className={styles.field}>
                  <span>Phone number <b aria-hidden="true">*</b></span>
                  <input autoComplete="tel" inputMode="tel" name="phone" pattern="[+0-9() .-]{7,20}" placeholder="Phone from your account" readOnly required type="tel" value={form.phone} />
                  <small>Contact details are pulled from your Collexus profile and can’t be changed on this form.</small>
                </label>
                <p className={`${styles.profileStatus} ${styles.spanTwo}`} role="status">{profileStatus}{!form.organizerName && <><a href={`${publicBasePath}/login/?next=%2Fhost-event%2F`}> Sign in</a> to continue.</>}</p>
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
                  <span>Event poster <b aria-hidden="true">*</b></span>
                  <input accept="image/jpeg,image/png,image/webp" name="poster" onChange={selectPoster} required type="file" />
                  <small>Required. Upload a JPG, PNG, or WebP image (up to 5 MB). It appears in the live preview immediately.</small>
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
                <label className={styles.field}>
                  <span>Event duration <b aria-hidden="true">*</b></span>
                  <select name="duration" onChange={update("duration")} required value={form.duration}>
                    <option value="" disabled hidden>Select event duration</option>
                    <option value="under_8_hours">Less than 8 hours</option>
                    <option value="8_hours">8 hours</option>
                    <option value="12_hours">12 hours</option>
                    <option value="24_hours">24 hours</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                {form.duration === "custom" && <label className={styles.field}>
                  <span>Custom duration (hours) <b aria-hidden="true">*</b></span>
                  <input min="1" max="168" name="customDurationHours" onChange={update("customDurationHours")} placeholder="e.g. 6.5" required step="0.5" type="number" value={form.customDurationHours} />
                </label>}
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
              <p className={styles.reviewPrompt}><ShieldCheck aria-hidden="true" size={18} /><span><strong>Before you continue:</strong> check the dates, venue, contact details, and price in the preview. Download a copy to share with the event team.</span></p>
              <div className={styles.draftActions}>
                <button className={styles.draftButton} onClick={saveDraft} type="button">Save draft on this device</button>
                <button className={styles.draftButton} onClick={restoreDraft} type="button">Restore saved draft</button>
                <button className={styles.draftButton} onClick={clearDraft} type="button">Clear saved draft</button>
              </div>
              <p>Your draft stays in this browser until you export it.</p>
              {draftStatus && <p className={styles.draftStatus} role="status">{draftStatus}</p>}
              {reviewed && <div className={styles.successMessage} role="status"><ShieldCheck aria-hidden="true" size={18} /><span>Required fields and date/time checks passed. Review the preview, then continue to plans or download a copy to share.</span></div>}
              {reviewed && <div className={styles.draftActions}>
                <button className={styles.submitButton} onClick={continueToHostPayment} type="button">Continue to plans and add-ons <ArrowRight aria-hidden="true" size={18} /></button>
                <button className={styles.draftButton} onClick={downloadSubmission} type="button">Download JSON copy</button>
              </div>}
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
                <div className={styles.previewMeta}><Clock3 aria-hidden="true" size={16} /><span>{durationLabel}</span></div>
                <div className={styles.previewMeta}><MapPin aria-hidden="true" size={16} /><span>{form.venue || "Event venue"}</span></div>
                <div className={styles.previewMeta}><Building2 aria-hidden="true" size={16} /><span>{form.institution === "Other institution" ? form.institutionOther || "Your institution" : form.institution || "Institution"}</span></div>
                <div className={styles.previewMeta}><UsersRound aria-hidden="true" size={16} /><span>{form.expectedParticipants ? `Around ${form.expectedParticipants} participants` : "Participant estimate"}</span></div>
                <div className={styles.previewFooter}><span>{form.pricing === "paid" && form.price ? `₹${form.price}` : form.pricing === "paid" ? "Paid entry" : "Free entry"}</span><span>{form.template || "Event layout not selected"}</span></div>
                <div className={styles.previewAudience}>For: {selectedAudience}</div>
              </div>
            </div>
            <div className={styles.checklist}>
              <ShieldCheck aria-hidden="true" size={19} />
              <div><strong>What happens next?</strong><p>Download a copy and share it with the event team. Your event is not published until Collexus approves it.</p></div>
            </div>
            <button className={styles.previewButton} onClick={() => document.querySelector<HTMLFormElement>("#host-event-form")?.requestSubmit()} type="button" aria-controls="host-event-form">
              <Send aria-hidden="true" size={17} /> Prepare submission <ArrowRight aria-hidden="true" size={16} />
            </button>
          </aside>
        </div>
        <footer className={styles.footer}>© 2026 Collexus <span>Campus events, in one place.</span></footer>
      </div>
    </main>
  );
}
