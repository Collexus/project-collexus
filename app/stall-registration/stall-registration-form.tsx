"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  ImagePlus,
  MapPin,
  Megaphone,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
  UsersRound,
  Zap,
} from "lucide-react";
import styles from "./stall-registration.module.css";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import { events } from "@/data/events";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const draftKey = "collexus-stall-request-v1";

type StallForm = {
  contactName: string;
  role: string;
  organization: string;
  email: string;
  phone: string;
  eventName: string;
  customEventName: string;
  eventDate: string;
  stallName: string;
  stallType: string;
  stallSize: string;
  locationPreference: string;
  teamSize: string;
  sellsProducts: string;
  power: boolean;
  water: boolean;
  stallBox: boolean;
  setupNotes: string;
  foodSafety: string;
  confirmed: boolean;
};

const initialForm: StallForm = {
  contactName: "", role: "", organization: "", email: "", phone: "", eventName: "", customEventName: "", eventDate: "",
  stallName: "", stallType: "", stallSize: "", locationPreference: "", teamSize: "",
  sellsProducts: "", power: false, water: false, stallBox: false, setupNotes: "", foodSafety: "", confirmed: false,
};

type MenuItem = { name: string; offerPrice: string; eventDayPrice: string };
const blankMenuItem = (): MenuItem => ({ name: "", offerPrice: "", eventDayPrice: "" });
type CollexusPackage = { plan: "normal" | "pro" | ""; addons: string[] };

export function StallRegistrationForm() {
  const [form, setForm] = useState<StallForm>(initialForm);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([blankMenuItem()]);
  const [menuTemplateImage, setMenuTemplateImage] = useState<File | null>(null);
  const [menuTemplatePreview, setMenuTemplatePreview] = useState("");
  const [collexusPackage, setCollexusPackage] = useState<CollexusPackage>({ plan: "", addons: [] });
  const [reviewed, setReviewed] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  useEffect(() => () => {
    if (menuTemplatePreview) URL.revokeObjectURL(menuTemplatePreview);
  }, [menuTemplatePreview]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const animation = window.requestAnimationFrame(() => setCollexusPackage({
      plan: plan === "normal" || plan === "pro" ? plan : "",
      addons: (params.get("addons") ?? "").split(",").filter(Boolean),
    }));
    return () => window.cancelAnimationFrame(animation);
  }, []);

  function update<K extends keyof StallForm>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const input = event.currentTarget;
      const value = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
      setForm((current) => ({ ...current, [key]: value }));
      setReviewed(false);
      setDraftMessage("");
    };
  }

  function updateMenuItem(index: number, key: keyof MenuItem, value: string) {
    setMenuItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
    setReviewed(false);
    setDraftMessage("");
  }

  function selectMenuTemplate(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setMenuTemplateImage(file);
    setMenuTemplatePreview(file ? URL.createObjectURL(file) : "");
    setReviewed(false);
    setDraftMessage("");
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
      localStorage.setItem(draftKey, JSON.stringify({ ...form, menuItems, menuTemplateImageName: menuTemplateImage?.name ?? "", collexusPackage }));
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
      const parsed = JSON.parse(saved) as Partial<StallForm> & { menuItems?: unknown; menuTemplateImageName?: string; collexusPackage?: CollexusPackage };
      const { menuItems: parsedMenuItems, menuTemplateImageName: _menuTemplateImageName, collexusPackage: savedPackage, ...savedForm } = parsed;
      void _menuTemplateImageName;
      setForm({ ...initialForm, ...savedForm });
      if (savedPackage) setCollexusPackage(savedPackage);
      setMenuItems(Array.isArray(parsedMenuItems) ? parsedMenuItems as MenuItem[] : [blankMenuItem()]);
      setMenuTemplateImage(null);
      setMenuTemplatePreview("");
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
      collexusPackage,
      menuItems: menuItems.filter((item) => item.name.trim()),
      menuTemplateImage: menuTemplateImage ? { fileName: menuTemplateImage.name, note: "Attach the selected image separately when sharing this request." } : null,
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
  const facilities = [form.power && "Power outlet", form.water && "Water access", form.stallBox && "Stall box / storage"].filter(Boolean);
  const selectedEventName = form.eventName === "Other / not listed" ? form.customEventName || form.eventName : form.eventName;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href={`${publicBasePath}/`} aria-label="Collexus home"><CollexusHomeLogo basePath={publicBasePath} /></a>
        <a className={styles.backLink} href={`${publicBasePath}/#featured-events`}><ArrowLeft size={17} aria-hidden="true" /><span>Back to events</span></a>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero} aria-labelledby="stall-title">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><Store size={15} aria-hidden="true" /> CAMPUS MARKET · STALL REQUEST</div>
            <h1 id="stall-title">Bring your idea<br />to the <em>campus market.</em></h1>
            <p>Tell us what you’d like to share. We’ll collect your setup preferences so the event team can review the request.</p>
            <div className={styles.heroMeta}><span><CheckCircle2 size={15} aria-hidden="true" /> One short application</span></div>
              {collexusPackage.plan && <p className={styles.packageSelection}>Collexus {collexusPackage.plan === "pro" ? "Pro" : "Normal"} · {collexusPackage.addons.length} add-on{collexusPackage.addons.length === 1 ? "" : "s"} selected</p>}
            <a className={styles.runAdButton} href="#stall-registration-form"><Megaphone size={17} aria-hidden="true" /> Run an ad <ArrowRight size={16} aria-hidden="true" /></a>
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
                <div className={`${styles.menuBuilder} ${styles.spanTwo}`}>
                  <div className={styles.menuBuilderHeading}><div><strong>Menu items &amp; pricing</strong><small>Add each item with its regular offer and event-day price.</small></div><button className={styles.addMenuItem} onClick={() => setMenuItems((current) => [...current, blankMenuItem()])} type="button"><Plus size={15} aria-hidden="true" /> Add item</button></div>
                  <div className={styles.menuTable} role="group" aria-label="Menu items and prices">
                    <div className={styles.menuTableHeader}><span>Menu item</span><span>Offer price (₹)</span><span>Event-day price (₹)</span><span className={styles.menuActionHeader}>Remove</span></div>
                    {menuItems.map((item, index) => <div className={styles.menuRow} key={index}>
                      <label className={styles.menuCell}><span className={styles.mobileMenuLabel}>Menu item</span><span className={styles.srOnly}>Menu item {index + 1}</span><input aria-label={`Menu item ${index + 1}`} onChange={(event) => updateMenuItem(index, "name", event.currentTarget.value)} placeholder="e.g. Veg wrap" required={index === 0} value={item.name} /></label>
                      <label className={styles.menuCell}><span className={styles.mobileMenuLabel}>Offer price (₹)</span><span className={styles.srOnly}>Offer price for item {index + 1}, rupees</span><input aria-label={`Offer price for item ${index + 1}, rupees`} inputMode="decimal" min="0" onChange={(event) => updateMenuItem(index, "offerPrice", event.currentTarget.value)} placeholder="120" required={index === 0 || Boolean(item.name.trim())} type="number" value={item.offerPrice} /></label>
                      <label className={styles.menuCell}><span className={styles.mobileMenuLabel}>Event-day price (₹)</span><span className={styles.srOnly}>Event-day price for item {index + 1}, rupees</span><input aria-label={`Event-day price for item ${index + 1}, rupees`} inputMode="decimal" min="0" onChange={(event) => updateMenuItem(index, "eventDayPrice", event.currentTarget.value)} placeholder="100" required={index === 0 || Boolean(item.name.trim())} type="number" value={item.eventDayPrice} /></label>
                      <button aria-label={`Remove menu item ${index + 1}`} className={styles.removeMenuItem} disabled={menuItems.length === 1} onClick={() => setMenuItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={15} aria-hidden="true" /></button>
                    </div>)}
                  </div>
                </div>
                <label className={styles.field}><span>Campus event / market <b>*</b></span><select name="eventName" onChange={update("eventName")} required value={form.eventName}><option value="" disabled hidden>Select an event</option>{events.map((event) => <option key={event.slug} value={event.title}>{event.title}</option>)}<option>Open campus market</option><option>Other / not listed</option></select></label>
                {form.eventName === "Other / not listed" && <label className={styles.field}><span>Event name <b>*</b></span><input name="customEventName" onChange={update("customEventName")} placeholder="Enter the event name" required value={form.customEventName} /></label>}
                <label className={styles.field}><span>Preferred event date</span><input name="eventDate" onChange={update("eventDate")} type="date" value={form.eventDate} /></label>
                <label className={styles.field}><span>Stall type <b>*</b></span><select name="stallSize" onChange={update("stallSize")} required value={form.stallSize}><option value="" disabled hidden>Select a stall type</option><option>Silver stall</option><option>Gold stall</option><option>Platinum stall</option></select><small>The event team will confirm final stall dimensions and placement.</small></label>
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
                  <label className={styles.facility}><input checked={form.stallBox} name="stallBox" onChange={update("stallBox")} type="checkbox" /><span><Store size={16} aria-hidden="true" /> Stall box / storage</span></label>
                </div>
              </fieldset>
              <label className={`${styles.imageUpload} ${styles.spanTwo}`}><span><ImagePlus size={18} aria-hidden="true" /><span><strong>Menu template image</strong><small>Optional · add a photo or menu design (JPG, PNG, or WebP).</small></span></span><input accept="image/*" name="menuTemplateImage" onChange={selectMenuTemplate} type="file" />{menuTemplateImage && <small>{menuTemplateImage.name}</small>}{menuTemplatePreview && <img className={styles.menuImagePreview} src={menuTemplatePreview} alt="Selected menu template preview" />}</label>
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
                <p>{menuItems.find((item) => item.name.trim())?.name || "Your menu and pricing will appear here."}</p>
                <div className={styles.summaryMeta}><MapPin size={16} aria-hidden="true" /><span>{selectedEventName || "Campus event / market"}</span></div>
                <div className={styles.summaryMeta}><UsersRound size={16} aria-hidden="true" /><span>{form.teamSize || "Stall team size"}</span></div>
                <div className={styles.summaryMeta}><Store size={16} aria-hidden="true" /><span>{form.stallSize || "Stall type"}</span></div>
                {menuItems.some((item) => item.name.trim()) && <div className={styles.summaryMenu}><strong>Menu &amp; pricing</strong>{menuItems.filter((item) => item.name.trim()).map((item, index) => <p key={index}>{item.name}<span>{item.offerPrice ? `₹${item.offerPrice}` : "—"}{item.eventDayPrice ? ` · ₹${item.eventDayPrice} event day` : ""}</span></p>)}</div>}
                {menuTemplateImage && <div className={styles.summaryMeta}><ImagePlus size={16} aria-hidden="true" /><span>{menuTemplateImage.name}</span></div>}
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
