"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  MapPin,
  ShieldCheck,
  Store,
  UsersRound,
  Zap,
} from "lucide-react";
import styles from "./stall-registration.module.css";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const draftKey = "collexus-stall-request-v1";

type StallForm = {
  contactName: string;
  role: string;
  organization: string;
  email: string;
  phone: string;
  eventName: string;
  eventDate: string;
  stallName: string;
  stallType: string;
  description: string;
  stallSize: string;
  locationPreference: string;
  teamSize: string;
  sellsProducts: string;
  power: boolean;
  water: boolean;
  table: boolean;
  setupNotes: string;
  foodSafety: string;
  confirmed: boolean;
};

const initialForm: StallForm = {
  contactName: "", role: "", organization: "", email: "", phone: "", eventName: "", eventDate: "",
  stallName: "", stallType: "", description: "", stallSize: "", locationPreference: "", teamSize: "",
  sellsProducts: "", power: false, water: false, table: false, setupNotes: "", foodSafety: "", confirmed: false,
};

export function StallRegistrationForm() {
  const [form, setForm] = useState<StallForm>(initialForm);
  const [reviewed, setReviewed] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  function update<K extends keyof StallForm>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const input = event.currentTarget;
      const value = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
      setForm((current) => ({ ...current, [key]: value }));
      setReviewed(false);
      setDraftMessage("");
    };
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewed(true);
    setDraftMessage("Your request is ready to review. Download a copy to share with the event team.");
    window.requestAnimationFrame(() => {
      const preview = document.getElementById("stall-request-summary");
      preview?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      preview?.focus({ preventScroll: true });
    });
  }

  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
      setDraftMessage("Draft saved on this device.");
    } catch {
      setDraftMessage("This browser could not save the draft. You can still download a request after reviewing it.");
    }
  }

  function restoreDraft() {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) {
        setDraftMessage("No saved stall request was found on this device.");
        return;
      }
      const parsed = JSON.parse(saved) as Partial<StallForm>;
      setForm({ ...initialForm, ...parsed });
      setReviewed(false);
      setDraftMessage("Saved draft restored.");
    } catch {
      setDraftMessage("The saved draft could not be read. It may have been cleared by the browser.");
    }
  }

  function downloadRequest() {
    const payload = {
      type: "Collexus stall registration request",
      createdAt: new Date().toISOString(),
      notice: "Local request file. This page does not submit or publish the application.",
      application: form,
    };
    const file = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collexus-stall-request-${form.stallName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "draft"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDraftMessage("Stall request downloaded to this device.");
  }

  const isFood = form.stallType === "Food & beverages";
  const facilities = [form.power && "Power outlet", form.water && "Water access", form.table && "Table and chairs"].filter(Boolean);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href={`${publicBasePath}/`} aria-label="Collexus home"><span className={styles.brandLogoFrame} aria-hidden="true"><img src={`${publicBasePath}/collexus-logo.svg`} alt="" /></span><span>Collexus</span></a>
        <a className={styles.backLink} href={`${publicBasePath}/#featured-events`}><ArrowLeft size={17} aria-hidden="true" /><span>Back to events</span></a>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero} aria-labelledby="stall-title">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><Store size={15} aria-hidden="true" /> CAMPUS MARKET · STALL REQUEST</div>
            <h1 id="stall-title">Bring your idea<br />to the <em>campus market.</em></h1>
            <p>Tell us what you’d like to share. We’ll collect your setup preferences so the event team can review the request.</p>
            <div className={styles.heroMeta}><span><CheckCircle2 size={15} aria-hidden="true" /> One short application</span><span><ShieldCheck size={15} aria-hidden="true" /> No payment collected here</span></div>
          </div>
          <div className={styles.heroArt}>
            <img src={`${publicBasePath}/images/stall-registration-illustration.webp`} alt="Two students welcoming visitors at a teal and cream campus market stall" width="1536" height="1024" />
            <span>MADE FOR CAMPUS CREATORS</span>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <form id="stall-registration-form" className={styles.form} onSubmit={submit}>
            <section className={styles.formSection} aria-labelledby="contact-heading">
              <div className={styles.sectionHeading}><span className={styles.step}>01</span><div><h2 id="contact-heading">Your details</h2><p>Who should the event team contact?</p></div></div>
              <div className={styles.fields}>
                <label className={`${styles.field} ${styles.spanTwo}`}><span>Contact person <b>*</b></span><input autoComplete="name" name="contactName" onChange={update("contactName")} placeholder="e.g. Ananya Rao" required value={form.contactName} /></label>
                <label className={styles.field}><span>Your role <b>*</b></span><select name="role" onChange={update("role")} required value={form.role}><option value="" disabled hidden>Select a role</option><option>Student or student team</option><option>Club or society</option><option>College department</option><option>Alumni</option><option>External vendor</option></select></label>
                <label className={styles.field}><span>Institution / group <b>*</b></span><input autoComplete="organization" name="organization" onChange={update("organization")} placeholder="College, club, or business name" required value={form.organization} /></label>
                <label className={styles.field}><span>Email address <b>*</b></span><input autoComplete="email" name="email" onChange={update("email")} placeholder="you@college.edu" required type="email" value={form.email} /></label>
                <label className={styles.field}><span>Phone number <b>*</b></span><input autoComplete="tel" inputMode="tel" name="phone" onChange={update("phone")} pattern="[+0-9() .-]{7,20}" placeholder="+91 98765 43210" required type="tel" value={form.phone} /></label>
              </div>
            </section>

            <section className={styles.formSection} aria-labelledby="stall-heading">
              <div className={styles.sectionHeading}><span className={styles.step}>02</span><div><h2 id="stall-heading">Your stall</h2><p>Give visitors a clear idea of what they’ll find.</p></div></div>
              <div className={styles.fields}>
                <label className={styles.field}><span>Stall name <b>*</b></span><input name="stallName" onChange={update("stallName")} placeholder="e.g. Little Loom Studio" required value={form.stallName} /></label>
                <label className={styles.field}><span>Stall category <b>*</b></span><select name="stallType" onChange={update("stallType")} required value={form.stallType}><option value="" disabled hidden>Choose a category</option><option>Food &amp; beverages</option><option>Art &amp; handmade goods</option><option>Student startup</option><option>Books &amp; merchandise</option><option>Club / community</option><option>Games &amp; activities</option><option>Other</option></select></label>
                <label className={`${styles.field} ${styles.spanTwo}`}><span>What will you offer? <b>*</b></span><textarea maxLength={500} name="description" onChange={update("description")} placeholder="Describe your products, activity, or idea in a few sentences." required rows={4} value={form.description} /><small className={styles.counter}>{form.description.length}/500</small></label>
                <label className={styles.field}><span>Campus event / market <b>*</b></span><input name="eventName" onChange={update("eventName")} placeholder="Event name or ‘Open campus market’" required value={form.eventName} /></label>
                <label className={styles.field}><span>Preferred event date</span><input name="eventDate" onChange={update("eventDate")} type="date" value={form.eventDate} /></label>
                <label className={styles.field}><span>Preferred stall space <b>*</b></span><select name="stallSize" onChange={update("stallSize")} required value={form.stallSize}><option value="" disabled hidden>Select a size</option><option>Compact table (about 1.5 × 1.5 m)</option><option>Standard stall (about 2 × 2 m)</option><option>Large stall (about 3 × 3 m)</option><option>Flexible — please advise</option></select><small>Final stall dimensions depend on venue availability.</small></label>
                <label className={styles.field}><span>Location preference <b>*</b></span><select name="locationPreference" onChange={update("locationPreference")} required value={form.locationPreference}><option value="" disabled hidden>Choose a preference</option><option>Indoor</option><option>Outdoor</option><option>No preference</option></select></label>
                <label className={styles.field}><span>People staffing the stall <b>*</b></span><select name="teamSize" onChange={update("teamSize")} required value={form.teamSize}><option value="" disabled hidden>Select team size</option><option>1–2 people</option><option>3–4 people</option><option>5–6 people</option><option>7 or more</option></select></label>
                <label className={styles.field}><span>Will you sell items?</span><select name="sellsProducts" onChange={update("sellsProducts")} value={form.sellsProducts}><option value="" disabled hidden>Select one</option><option>Yes, products or food</option><option>No, information or activities only</option></select></label>
                {isFood && <label className={styles.field}><span>Food safety registration <b>*</b></span><select name="foodSafety" onChange={update("foodSafety")} required value={form.foodSafety}><option value="" disabled hidden>Select current status</option><option>Available to provide</option><option>In progress</option><option>Need guidance</option></select><small>The event team will confirm any venue requirements.</small></label>}
              </div>
            </section>

            <section className={styles.formSection} aria-labelledby="setup-heading">
              <div className={styles.sectionHeading}><span className={styles.step}>03</span><div><h2 id="setup-heading">Setup &amp; access</h2><p>Help us understand what you need at the venue.</p></div></div>
              <fieldset className={styles.facilities}>
                <legend>Facilities requested <span>(select all that apply)</span></legend>
                <div className={styles.facilityOptions}>
                  <label className={styles.facility}><input checked={form.power} name="power" onChange={update("power")} type="checkbox" /><span><Zap size={16} aria-hidden="true" /> Power outlet</span></label>
                  <label className={styles.facility}><input checked={form.water} name="water" onChange={update("water")} type="checkbox" /><span><MapPin size={16} aria-hidden="true" /> Water access</span></label>
                  <label className={styles.facility}><input checked={form.table} name="table" onChange={update("table")} type="checkbox" /><span><Store size={16} aria-hidden="true" /> Table &amp; chairs</span></label>
                </div>
              </fieldset>
              <label className={`${styles.field} ${styles.spanTwo}`}><span>Other setup notes</span><textarea maxLength={400} name="setupNotes" onChange={update("setupNotes")} placeholder="Accessibility needs, equipment details, or anything else the team should know." rows={3} value={form.setupNotes} /></label>
              <label className={styles.confirm}><input checked={form.confirmed} onChange={update("confirmed")} required type="checkbox" /><span>I confirm these details are accurate. I understand this is a request, and the event team will confirm space, requirements, and any fees.</span></label>
            </section>

            <div className={styles.actions}>
              <button className={styles.primaryButton} type="submit">Review stall request <ArrowRight size={18} aria-hidden="true" /></button>
              <button className={styles.secondaryButton} onClick={saveDraft} type="button">Save draft on this device</button>
              <button className={styles.secondaryButton} onClick={restoreDraft} type="button">Restore saved draft</button>
              <p>Your form stays in this browser. Nothing is sent to a server from this page.</p>
              {draftMessage && <p className={styles.status} role="status">{draftMessage}</p>}
            </div>
          </form>

          <aside className={styles.sidebar} aria-label="Stall request preview">
            <section id="stall-request-summary" className={styles.summary} tabIndex={-1}>
              <div className={styles.summaryTop}><span>REQUEST PREVIEW</span><span className={styles.draft}><i /> DRAFT</span></div>
              <div className={styles.summaryArt}><img src={`${publicBasePath}/images/stall-registration-illustration.webp`} alt="Two students at a teal and cream campus market stall" width="1536" height="1024" /></div>
              <div className={styles.summaryBody}>
                <span className={styles.category}>{form.stallType || "STALL CATEGORY"}</span>
                <h2>{form.stallName || "Your stall name"}</h2>
                <p>{form.description || "A short description of your products or activity will appear here."}</p>
                <div className={styles.summaryMeta}><MapPin size={16} aria-hidden="true" /><span>{form.eventName || "Campus event / market"}</span></div>
                <div className={styles.summaryMeta}><UsersRound size={16} aria-hidden="true" /><span>{form.teamSize || "Stall team size"}</span></div>
                <div className={styles.summaryMeta}><Store size={16} aria-hidden="true" /><span>{form.stallSize || "Preferred stall space"}</span></div>
                <div className={styles.summaryFooter}><span>{form.locationPreference || "Location preference"}</span><span>{facilities.length ? facilities.join(" · ") : "Setup needs"}</span></div>
                {reviewed && <div className={styles.reviewed}><CheckCircle2 size={18} aria-hidden="true" /> Request details reviewed</div>}
              </div>
            </section>
            <div className={styles.infoCard}><ShieldCheck size={20} aria-hidden="true" /><div><strong>What happens next?</strong><p>Review the details, then download the request file and share it with your event team. This page cannot reserve a stall.</p></div></div>
            {reviewed && <button className={styles.downloadButton} onClick={downloadRequest} type="button"><Download size={17} aria-hidden="true" /> Download stall request <ArrowRight size={16} aria-hidden="true" /></button>}
            <a className={styles.backLink} href={`${publicBasePath}/#featured-events`}><ArrowLeft size={16} aria-hidden="true" /> Explore published events</a>
          </aside>
        </div>
        <footer className={styles.footer}><span>© 2026 Collexus</span><span>Campus events, in one place.</span></footer>
      </div>
    </main>
  );
}
