"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, ChevronDown,
  Compass, GraduationCap, LoaderCircle, Plus, ShieldCheck, X,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase-client";
import { getUserProfile, updateUserProfile } from "../../lib/user-profile";
import styles from "./skills.module.css";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const localDraftKey = "collexus:skills-profile-draft";
const branches = ["Computer Science & Engineering", "Information Technology", "Artificial Intelligence & Data Science", "Electronics & Communication", "Electrical & Electronics", "Mechanical Engineering", "Civil Engineering", "Business & Management", "Arts & Humanities", "Science", "Other"];
const skillSuggestions = ["Programming", "JavaScript", "Python", "UI/UX Design", "Communication", "Leadership", "Problem Solving", "Public Speaking", "Data Science", "Graphic Design", "Project Management", "Photography"];
const technologySuggestions = ["JavaScript", "TypeScript", "Python", "Java", "C++", "React", "Next.js", "Node.js", "HTML & CSS", "SQL", "Supabase", "Git & GitHub", "AWS", "Figma", "Flutter", "Machine Learning"];
const interestSuggestions = ["Art", "Music", "Gaming", "Books", "Movies", "Photography", "Sports", "Travel", "Cooking", "Dance", "Reading", "Volunteering"];
const experienceOptions = ["1st year", "2nd year", "3rd year", "4th year", "Recent graduate", "Working professional"];
const foodSuggestions = ["Biryani", "Dosa", "Idli", "Pizza", "Pasta", "Street food", "Sweets", "Coffee", "Tea", "Andhra meals", "Pani puri"];
const removedInterestLabels = new Set(["Wellness", "Life", "Society", "Business", "Culture"]);
const allTechnologyOptions = new Set([
  ...technologySuggestions, "Technology", "AI", "Artificial Intelligence", "Cybersecurity", "AWS", "LLM", "ChatGPT", "UX", "UX Design", "Android", "iOS", "Apple", "AI Agent", "Future Tech", "Kubernetes",
  "Programming", "Data Science", "Software Development", "Software Engineering", "Machine Learning", "DevOps", "Web Development", "Data Engineering", "Deep Learning",
]);

function readArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function TagField({ label, hint, values, draft, setDraft, onAdd, onRemove, placeholder, suggestions, id }: {
  label: string; hint?: string; values: string[]; draft: string; setDraft: (value: string) => void;
  onAdd: (value: string) => void; onRemove: (value: string) => void; placeholder: string;
  suggestions?: string[]; id: string;
}) {
  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); onAdd(draft); }
    if (event.key === "Backspace" && !draft && values.length) onRemove(values[values.length - 1]);
  }
  return <fieldset className={styles.fieldset}>
    <legend>{label}{hint && <small>{hint}</small>}</legend>
    <div className={styles.tagBox}>
      {values.map((value) => <span className={styles.tag} key={value}>{value}<button type="button" aria-label={`Remove ${value}`} onClick={() => onRemove(value)}><X size={14} aria-hidden="true" /></button></span>)}
      <input id={id} aria-label={label} value={draft} maxLength={40} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKey} onBlur={() => { if (draft.trim()) onAdd(draft); }} placeholder={placeholder} />
      <button className={styles.addButton} type="button" aria-label={`Add ${label.toLowerCase()}`} onClick={() => onAdd(draft)}><Plus size={17} aria-hidden="true" /></button>
    </div>
    {suggestions?.length ? <div className={styles.suggestions} aria-label={`${label} suggestions`}>{suggestions.filter((item) => !values.includes(item)).map((item) => <button type="button" key={item} onClick={() => onAdd(item)}>{item}<Plus size={12} aria-hidden="true" /></button>)}</div> : null}
  </fieldset>;
}

export function SkillsExperience() {
  const [configured] = useState(isSupabaseConfigured());
  const [checking, setChecking] = useState(() => isSupabaseConfigured());
  const [user, setUser] = useState<User | null>(null);
  const [profileReady, setProfileReady] = useState(() => !isSupabaseConfigured());
  const [branch, setBranch] = useState("");
  const [otherBranch, setOtherBranch] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [technologyDraft, setTechnologyDraft] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestDraft, setInterestDraft] = useState("");
  const [foods, setFoods] = useState<string[]>([]);
  const [foodDraft, setFoodDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    if (!supabase) {
      const draftTimer = window.setTimeout(() => {
        try {
          const draft = JSON.parse(localStorage.getItem(localDraftKey) ?? "null") as Record<string, unknown> | null;
          if (draft) {
            setBranch(String(draft.profile_branch_category ?? ""));
            setOtherBranch(String(draft.profile_branch_details ?? ""));
            setExperience(String(draft.profile_experience ?? ""));
            setSkills(readArray(draft.profile_skills));
            const savedInterests = readArray(draft.profile_interests);
            const oldTech = savedInterests.filter((item) => allTechnologyOptions.has(item));
            setTechnologies([...new Set([...readArray(draft.profile_technologies), ...oldTech])]);
            setInterests(savedInterests.filter((item) => !allTechnologyOptions.has(item) && !removedInterestLabels.has(item)));
            setFoods(readArray(draft.profile_favorite_foods));
          }
        } catch { /* Keep the form usable when browser storage is unavailable. */ }
      }, 0);
      return () => window.clearTimeout(draftTimer);
    }
    void supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) { window.location.replace(`${basePath}/login/?next=%2Fabout-you%2F`); return; }
      const currentUser = data.user;
      const metadata = currentUser.user_metadata;
      setUser(currentUser);
      const { profile, error: profileError } = await getUserProfile(supabase, currentUser.id);
      if (!active) return;
      if (profileError || !profile) {
        setError("Profile storage isn’t ready yet. Apply the Collexus profiles migration, then refresh this page.");
        setChecking(false);
        return;
      }
      setBranch(profile.profile_branch_category ?? String(metadata.profile_branch_category ?? metadata.profile_branch ?? ""));
      setOtherBranch(profile.profile_branch_details ?? String(metadata.profile_branch_details ?? ""));
      setExperience(profile.profile_experience ?? String(metadata.profile_experience ?? ""));
      setSkills(readArray(profile.profile_skills ?? metadata.profile_skills));
      const savedInterests = readArray(profile.profile_interests ?? metadata.profile_interests);
      const oldTech = savedInterests.filter((item) => allTechnologyOptions.has(item));
      setTechnologies([...new Set([...readArray(profile.profile_technologies ?? metadata.profile_technologies), ...oldTech])]);
      setInterests(savedInterests.filter((item) => !allTechnologyOptions.has(item) && !removedInterestLabels.has(item)));
      setFoods(readArray(profile.profile_favorite_foods ?? metadata.profile_favorite_foods));
      setProfileReady(true);
      setChecking(false);
    }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  function addValue(value: string, values: string[], update: (values: string[]) => void, clear: () => void, limit = 12) {
    const normalized = value.trim().replace(/,+$/, "").trim();
    if (!normalized || values.length >= limit || values.some((item) => item.toLowerCase() === normalized.toLowerCase())) return;
    update([...values, normalized]); clear(); setSaved(false); setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaved(false);
    if (!skills.length) { setError("Add at least one skill to continue."); return; }
    if (!interests.length) { setError("Choose at least one interest to continue."); return; }
    const supabase = getSupabaseClient();
    if (!supabase) {
      try {
        localStorage.setItem(localDraftKey, JSON.stringify({
          profile_branch: branch === "Other" ? otherBranch.trim() : branch,
          profile_branch_category: branch,
          profile_branch_details: branch === "Other" ? otherBranch.trim() : "",
          profile_experience: experience,
          profile_skills: skills,
          profile_technologies: technologies,
          profile_interests: interests,
          profile_favorite_foods: foods,
        }));
        setSaved(true);
      } catch { setError("Your browser couldn’t save this draft. Check its storage settings and try again."); }
      return;
    }
    if (!user) { setError("Sign in to save your profile details."); return; }
    setBusy(true);
    const { error: updateError } = await updateUserProfile(supabase, user.id, {
      profile_branch_category: branch,
      profile_branch_details: branch === "Other" ? otherBranch.trim() : "",
      profile_experience: experience,
      profile_skills: skills,
      profile_technologies: technologies,
      profile_interests: interests,
      profile_favorite_foods: foods,
      profile_complete: true,
    });
    setBusy(false);
    if (updateError) { setError("We couldn’t save your details. Check your connection and try again."); return; }
    setSaved(true);
  }

  const selectedCount = skills.length + technologies.length + interests.length + foods.length + Number(Boolean(branch && (branch !== "Other" || otherBranch.trim()))) + Number(Boolean(experience));

  return <main className={styles.page}>
    <header className={styles.header}>
      <a className={styles.brand} href={`${basePath}/`} aria-label="Collexus home"><CollexusHomeLogo basePath={basePath} /></a>
      <a className={styles.backLink} href={`${basePath}/`}><ArrowLeft size={16} aria-hidden="true" /> Back to events</a>
    </header>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}><p className={styles.eyebrow}>YOUR COLLEXUS PROFILE</p><h1>Show them what<br /><em>makes you, you.</em></h1><p className={styles.heroText}>Share your skills, study details, interests, technologies and favorite foods. Find your people, your next team and more events that feel like you.</p><div className={styles.privacyPill}><ShieldCheck size={15} aria-hidden="true" /> You choose what to share</div></div>
        <div className={styles.heroIllustration}><Image src={`${basePath}/images/host-event-planning-illustration.png`} alt="Students planning an event together" width={1536} height={1024} priority unoptimized /></div>
      </section>
      <div className={styles.progressWrap}><div className={styles.progressTrack}><span style={{ width: `${Math.min(100, 24 + selectedCount * 5)}%` }} /></div><p><strong>{selectedCount}</strong> details added <span>·</span> About 2 minutes</p></div>
      {checking ? <div className={styles.notice}><LoaderCircle className={styles.spinner} size={21} aria-hidden="true" /> Checking your account…</div> : <div className={styles.contentGrid}>
        <form className={styles.form} onSubmit={save}>
          <div className={styles.sectionHead}><span className={styles.headingIcon}><GraduationCap size={21} aria-hidden="true" /></span><div><p className={styles.sectionKicker}>01 — YOUR DETAILS</p><h2>Where are you on your journey?</h2><p>Choose your branch and year, then add the things you know and enjoy.</p></div></div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}><span>Your branch <b>*</b></span><span className={styles.selectWrap}><Compass size={16} aria-hidden="true" /><select required value={branch} onChange={(event) => { setBranch(event.target.value); setSaved(false); }}><option value="">Choose your branch</option>{branches.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span></label>
            {branch === "Other" && <label className={styles.field}><span>Enter your branch <b>*</b></span><input className={styles.textInput} required maxLength={80} value={otherBranch} onChange={(event) => { setOtherBranch(event.target.value); setSaved(false); }} placeholder="e.g. Biotechnology" /></label>}
            <label className={styles.field}><span>Year / experience <b>*</b></span><span className={styles.selectWrap}><BookOpen size={16} aria-hidden="true" /><select required value={experience} onChange={(event) => { setExperience(event.target.value); setSaved(false); }}><option value="">Choose your year</option>{experienceOptions.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span></label>
          </div>
          <section className={styles.profileSection} aria-labelledby="skills-title"><div className={styles.groupHeading}><div><p className={styles.sectionKicker}>02 — YOUR STRENGTHS</p><h2 id="skills-title">Skills</h2></div><span className={styles.countBadge}>{skills.length} selected</span></div>
            <TagField id="skills-entry" label="Your skills" hint="Required · add up to 12" values={skills} draft={skillDraft} setDraft={setSkillDraft} onAdd={(value) => addValue(value, skills, setSkills, () => setSkillDraft(""))} onRemove={(value) => { setSkills((current) => current.filter((item) => item !== value)); setSaved(false); }} placeholder="Type a skill and press Enter" suggestions={skillSuggestions} />
          </section>
          <section className={styles.profileSection} aria-labelledby="technology-title"><div className={styles.groupHeading}><div><p className={styles.sectionKicker}>03 — TOOLS & TECH</p><h2 id="technology-title">Technologies you use</h2></div><span className={styles.countBadge}>{technologies.length} selected</span></div>
            <TagField id="technology-entry" label="Technologies" hint="Optional · add up to 12" values={technologies} draft={technologyDraft} setDraft={setTechnologyDraft} onAdd={(value) => addValue(value, technologies, setTechnologies, () => setTechnologyDraft(""))} onRemove={(value) => { setTechnologies((current) => current.filter((item) => item !== value)); setSaved(false); }} placeholder="Add a language, tool or platform" suggestions={technologySuggestions} />
          </section>
          <section className={styles.profileSection} aria-labelledby="interest-title"><div className={styles.groupHeading}><div><p className={styles.sectionKicker}>04 — WHAT YOU LOVE</p><h2 id="interest-title">Interests <small>* choose at least one</small></h2></div><span className={styles.countBadge}>{interests.length} selected</span></div>
            <TagField id="interest-entry" label="Interests" hint="Choose or add up to 12" values={interests} draft={interestDraft} setDraft={setInterestDraft} onAdd={(value) => addValue(value, interests, setInterests, () => setInterestDraft(""))} onRemove={(value) => { setInterests((current) => current.filter((item) => item !== value)); setSaved(false); }} placeholder="Type an interest and press Enter" suggestions={interestSuggestions} />
          </section>
          <section className={styles.profileSection} aria-labelledby="food-title"><div className={styles.groupHeading}><div><p className={styles.sectionKicker}>05 — FOOD FAVOURITES</p><h2 id="food-title">Loved food items</h2></div></div>
            <TagField id="food-entry" label="Loved food items" hint="Optional · help friends plan the next food run" values={foods} draft={foodDraft} setDraft={setFoodDraft} onAdd={(value) => addValue(value, foods, setFoods, () => setFoodDraft(""))} onRemove={(value) => { setFoods((current) => current.filter((item) => item !== value)); setSaved(false); }} placeholder="Add a favorite food" suggestions={foodSuggestions} />
          </section>
          {error && <p className={styles.error} role="alert">{error}</p>}{saved && <p className={styles.success} role="status"><BadgeCheck size={17} aria-hidden="true" /> Your profile details are saved.</p>}
          {!configured && <p className={styles.setupNotice}><ShieldCheck size={16} aria-hidden="true" /> Your profile service isn’t connected yet. You can still fill out the page and save a draft in this browser.</p>}
          <div className={styles.actions}><button className={styles.primaryButton} type="submit" disabled={busy || (configured && !profileReady)}>{busy ? <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> Saving…</> : <>{configured ? "Save my details" : "Save this draft"} <ArrowRight size={17} aria-hidden="true" /></>}</button><a href={`${basePath}/#featured-events`}>Maybe later</a></div>
        </form>
      </div>}
      <footer className={styles.footer}><span>© 2026 Collexus</span><span>Find your people. Find your next experience.</span></footer>
    </div>
  </main>;
}
