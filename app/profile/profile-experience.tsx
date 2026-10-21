"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, Check,
  ChevronDown, CircleUserRound, Compass, GraduationCap, Heart, Lightbulb,
  LoaderCircle, Plus, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase-client";
import styles from "./profile.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const domains = ["Artificial intelligence & data", "Web & app development", "Robotics & IoT", "Cybersecurity", "Design & creative media", "Business & entrepreneurship", "Research & academia", "Mechanical & manufacturing", "Electrical & electronics", "Other"];
const skillsList = ["Communication", "Leadership", "Problem solving", "JavaScript", "Python", "UI/UX design", "Public speaking", "Project management"];
const interestsList = ["Hackathons", "Workshops", "Design", "Technology", "Volunteering", "Research", "Entrepreneurship", "Arts & culture", "Sports", "Community"];

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function ProfileExperience() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [about, setAbout] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    setConfigured(isSupabaseConfigured());
    if (!supabase) {
      setChecking(false);
      return;
    }
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        window.location.replace(`${basePath}/login/`);
        return;
      }
      const current = data.user;
      const metadata = current.user_metadata;
      setUser(current);
      setName(String(metadata.full_name ?? metadata.name ?? ""));
      setDomain(String(metadata.profile_domain ?? ""));
      setSkills(readStringArray(metadata.profile_skills));
      setInterests(readStringArray(metadata.profile_interests));
      setAbout(String(metadata.profile_about ?? ""));
      setChecking(false);
    }).catch(() => {
      if (active) {
        setError("We couldn’t check your account. Please try again.");
        setChecking(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) window.location.replace(`${basePath}/login/`);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  function addSkill(value: string) {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized || skills.length >= 10 || skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) return;
    setSkills((current) => [...current, normalized]);
    setSkillDraft("");
    setSaved(false);
  }

  function handleSkillKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(skillDraft);
    }
    if (event.key === "Backspace" && !skillDraft && skills.length) {
      setSkills((current) => current.slice(0, -1));
    }
  }

  function toggleInterest(value: string) {
    setInterests((current) => current.includes(value) ? current.filter((interest) => interest !== value) : [...current, value]);
    setSaved(false);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (!domain) {
      setError("Choose your main area of interest to continue.");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Secure profile saving is not configured yet. Add the Supabase project URL and publishable key first.");
      return;
    }
    setBusy(true);
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: name.trim(),
        profile_domain: domain,
        profile_skills: skills,
        profile_interests: interests,
        profile_about: about.trim(),
        profile_complete: true,
      },
    });
    setBusy(false);
    if (updateError) {
      setError("We couldn’t save your profile. Check your connection and try again.");
      return;
    }
    if (data.user) setUser(data.user);
    setSaved(true);
  }

  const displayName = name.trim() || user?.email?.split("@")[0] || "Your name";
  const accountType = String(user?.user_metadata.account_type ?? "member");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href={`${basePath}/`} aria-label="Collexus home">
          <span className={styles.logoFrame} aria-hidden="true"><img src={`${basePath}/collexus-logo.svg`} alt="" /></span>
          <span>Collexus</span>
        </a>
        <a className={styles.backLink} href={`${basePath}/#featured-events`}><ArrowLeft size={16} aria-hidden="true" /> Back to events</a>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}><Sparkles size={15} aria-hidden="true" /> YOUR COLLEXUS PROFILE</p>
            <h1>Make campus<br /><em>feel a little smaller.</em></h1>
            <p className={styles.introText}>Tell the community what you’re curious about. Your profile helps you find the people, events and opportunities that fit.</p>
            <div className={styles.accountPill}><ShieldCheck size={15} aria-hidden="true" /> Your details stay with your account</div>
          </div>
          <div className={styles.illustration}>
            <img src={`${basePath}/profile-community.webp`} alt="Three students sharing ideas around a tablet" />
            <span className={styles.illustrationNote}><Lightbulb size={15} aria-hidden="true" /> Curious minds meet here</span>
          </div>
        </section>

        <div className={styles.progressWrap} aria-label="Profile setup progress">
          <ol className={styles.progress}>
            <li aria-current="step"><span>01</span><div><strong>Your focus</strong><small>Domain & skills</small></div></li>
            <li><span>02</span><div><strong>Your interests</strong><small>What you enjoy</small></div></li>
            <li><span>03</span><div><strong>Your story</strong><small>A short introduction</small></div></li>
          </ol>
          <p>About 1 minute</p>
        </div>

        {checking ? (
          <div className={styles.loading}><LoaderCircle size={22} aria-hidden="true" /> Checking your account…</div>
        ) : !user ? (
          <section className={styles.noticeCard}>
            <ShieldCheck size={22} aria-hidden="true" />
            <div><h2>{configured ? "Sign in to create your profile" : "Account setup is almost ready"}</h2><p>{configured ? "We’ll take you to sign in, then bring you right back here." : "Supabase needs a project URL and publishable key before an account can be loaded or saved."}</p><a className={styles.primaryButton} href={`${basePath}/login/`}>Go to sign in <ArrowRight size={17} aria-hidden="true" /></a></div>
          </section>
        ) : (
          <div className={styles.contentGrid}>
            <form className={styles.form} onSubmit={saveProfile}>
              <div className={styles.formHeading}>
                <span className={styles.headingIcon}><CircleUserRound size={20} aria-hidden="true" /></span>
                <div><p className={styles.sectionKicker}>PROFILE DETAILS</p><h2>Start with what makes you, you.</h2><p>Choose a domain, add a few skills and share what you’re into.</p></div>
              </div>

              <label className={styles.field}>
                <span>Your name <small>Shown on your profile</small></span>
                <input autoComplete="name" maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} placeholder="e.g. Ananya Rao" />
              </label>

              <label className={styles.field}>
                <span>Which domain are you in? <b>*</b></span>
                <span className={styles.selectWrap}><Compass size={17} aria-hidden="true" /><select value={domain} onChange={(event) => { setDomain(event.target.value); setSaved(false); }} required>
                  <option value="">Choose your main domain</option>{domains.map((item) => <option key={item} value={item}>{item}</option>)}
                </select><ChevronDown size={16} aria-hidden="true" /></span>
                <small>Pick the area you study, work in or want to explore.</small>
              </label>

              <fieldset className={styles.fieldset}>
                <legend>Skills <small>Choose a few or add your own</small></legend>
                <div className={styles.chipInput}>
                  {skills.map((skill) => <span className={styles.skillChip} key={skill}>{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => { setSkills((current) => current.filter((item) => item !== skill)); setSaved(false); }}><X size={13} aria-hidden="true" /></button></span>)}
                  <input aria-label="Add a skill" value={skillDraft} maxLength={32} onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={handleSkillKey} onBlur={() => { if (skillDraft.trim()) addSkill(skillDraft); }} placeholder={skills.length ? "Add another skill…" : "Type a skill and press Enter"} />
                  <button className={styles.addSkill} type="button" aria-label="Add skill" onClick={() => addSkill(skillDraft)}><Plus size={16} aria-hidden="true" /></button>
                </div>
                <div className={styles.suggestions} aria-label="Suggested skills">{skillsList.filter((item) => !skills.includes(item)).slice(0, 6).map((item) => <button type="button" key={item} onClick={() => addSkill(item)} disabled={skills.length >= 10}>{item}<Plus size={12} aria-hidden="true" /></button>)}</div>
                <small>Up to 10 skills. Press Enter or comma to add one.</small>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend>Personal interests <small>Pick as many as you like</small></legend>
                <div className={styles.interestGrid}>{interestsList.map((item) => {
                  const selected = interests.includes(item);
                  return <button type="button" key={item} aria-pressed={selected} className={selected ? styles.interestSelected : styles.interest} onClick={() => toggleInterest(item)}>{selected && <Check size={13} aria-hidden="true" />}{item}</button>;
                })}</div>
              </fieldset>

              <label className={styles.field}>
                <span>About you <small>Optional</small></span>
                <textarea value={about} onChange={(event) => { setAbout(event.target.value); setSaved(false); }} maxLength={280} rows={4} placeholder="A few lines about what you’re learning, building or hoping to meet…" />
                <small className={styles.counter}>{about.length}/280 · Keep it friendly and brief</small>
              </label>

              {error && <p className={styles.error} role="alert">{error}</p>}
              {saved && <p className={styles.success} role="status"><BadgeCheck size={17} aria-hidden="true" /> Profile saved. You’re ready to explore Collexus.</p>}
              {!configured && <p className={styles.setupNotice}>Supabase is not configured yet, so saving is disabled until its project URL and publishable key are added.</p>}

              <div className={styles.formActions}>
                <button className={styles.primaryButton} type="submit" disabled={busy || !configured}>{busy ? <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> Saving profile…</> : <>Save profile <ArrowRight size={17} aria-hidden="true" /></>}</button>
                <a href={`${basePath}/#featured-events`}>I’ll do this later</a>
              </div>
            </form>

            <aside className={styles.preview} aria-label="Profile preview">
              <div className={styles.previewTop}><span>PROFILE PREVIEW</span><span className={styles.live}><i /> LIVE</span></div>
              <div className={styles.previewBody}>
                <div className={styles.avatar}><span>{displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "C"}</span><i><Check size={12} aria-hidden="true" /></i></div>
                <span className={styles.roleBadge}>{accountType === "guest" ? "CAMPUS GUEST" : accountType === "faculty" ? "FACULTY" : "STUDENT"}</span>
                <h3>{displayName}</h3>
                <p className={styles.previewEmail}>{user.email}</p>
                <div className={styles.previewDivider} />
                <p className={styles.previewLabel}><BookOpen size={14} aria-hidden="true" /> DOMAIN</p>
                <p className={styles.previewValue}>{domain || "Your area of focus"}</p>
                <p className={styles.previewLabel}><BriefcaseBusiness size={14} aria-hidden="true" /> SKILLS</p>
                {skills.length ? <div className={styles.previewChips}>{skills.slice(0, 4).map((item) => <span key={item}>{item}</span>)}{skills.length > 4 && <span>+{skills.length - 4}</span>}</div> : <p className={styles.previewEmpty}>Your skills will show up here.</p>}
                <p className={styles.previewLabel}><Heart size={14} aria-hidden="true" /> INTERESTS</p>
                {interests.length ? <div className={styles.previewChips}>{interests.slice(0, 4).map((item) => <span key={item}>{item}</span>)}{interests.length > 4 && <span>+{interests.length - 4}</span>}</div> : <p className={styles.previewEmpty}>Pick a few things you enjoy.</p>}
                <div className={styles.aboutPreview}>{about || "Your introduction will appear here once you add a little about yourself."}</div>
              </div>
              <div className={styles.previewFoot}><GraduationCap size={16} aria-hidden="true" /> <span>A little more connected, already.</span></div>
              <div className={styles.privacyNote}><ShieldCheck size={16} aria-hidden="true" /><p><strong>Your profile, your choice.</strong><br />Only share what you’re comfortable sharing. You can edit these details any time.</p></div>
            </aside>
          </div>
        )}

        <footer className={styles.footer}><span>© 2026 Collexus</span><span>Campus events, in one place.</span></footer>
      </div>
    </main>
  );
}
