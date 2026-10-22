"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Check, ChevronDown, CircleUserRound,
  Compass, GraduationCap, Heart, LoaderCircle, Plus, Search, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase-client";
import styles from "./skills.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const localDraftKey = "collexus:skills-profile-draft";
const branches = ["Computer Science & Engineering", "Information Technology", "Artificial Intelligence & Data Science", "Electronics & Communication", "Electrical & Electronics", "Mechanical Engineering", "Civil Engineering", "Business & Management", "Arts & Humanities", "Science", "Other"];
const skillSuggestions = ["Programming", "JavaScript", "Python", "UI/UX Design", "Communication", "Leadership", "Problem Solving", "Public Speaking", "Data Science", "Graphic Design", "Project Management", "Photography"];
const technologySuggestions = ["JavaScript", "TypeScript", "Python", "Java", "C++", "React", "Next.js", "Node.js", "HTML & CSS", "SQL", "Supabase", "Git & GitHub", "AWS", "Figma", "Flutter", "Machine Learning"];
const interestGroups = [
  { name: "Wellness", tone: "rose", tags: ["Psychology", "Self Improvement", "Mental Health", "Productivity", "Spirituality", "Personal Growth", "Wellness", "Mindfulness", "Fitness", "Personal Development", "Motivation", "Sports"] },
  { name: "Life", tone: "gold", tags: ["Life", "Relationships", "Love", "Life Lessons", "Health", "Travel", "Lifestyle", "Family", "Parenting", "Faith", "Healing", "Sexuality"] },
  { name: "Society", tone: "blue", tags: ["Politics", "Women", "History", "Society", "News", "War", "Economics", "Religion", "Christianity", "Feminism", "Geopolitics", "World", "Justice", "Equality", "Ukraine War"] },
  { name: "Culture", tone: "plum", tags: ["Science", "Writing", "Culture", "Philosophy", "Education", "Books", "Humor", "Space", "Inspiration", "Creativity", "Art", "Music", "Gaming", "Math"] },
  { name: "Business", tone: "teal", tags: ["Business", "Money", "Entrepreneurship", "Leadership", "Startup", "Careers", "Finance", "Investing", "Work", "Marketing", "Cryptocurrency"] },
];
const experienceOptions = ["1st year", "2nd year", "3rd year", "4th year", "5th year or above", "Recent graduate", "Working professional"];
const cultureSuggestions = ["Telugu", "Tamil", "Hindi", "Classical dance", "Folk music", "Anime", "Regional festivals", "Photography"];
const foodSuggestions = ["Biryani", "Dosa", "Idli", "Pizza", "Pasta", "Street food", "Sweets", "Coffee", "Tea", "Andhra meals", "Pani puri"];
const allInterestOptions = new Set(interestGroups.flatMap((group) => group.tags));
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
  const [user, setUser] = useState<User | null>(null);
  const [configured] = useState(isSupabaseConfigured());
  const [checking, setChecking] = useState(() => isSupabaseConfigured());
  const [branch, setBranch] = useState("");
  const [otherBranch, setOtherBranch] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [technologyDraft, setTechnologyDraft] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [interestDraft, setInterestDraft] = useState("");
  const [interestSearch, setInterestSearch] = useState("");
  const [culture, setCulture] = useState<string[]>([]);
  const [cultureDraft, setCultureDraft] = useState("");
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
            const remainingInterests = savedInterests.filter((item) => !allTechnologyOptions.has(item));
            setInterests(remainingInterests.filter((item) => allInterestOptions.has(item)));
            setCustomInterests(remainingInterests.filter((item) => !allInterestOptions.has(item)));
            setCulture(readArray(draft.profile_culture));
            setFoods(readArray(draft.profile_favorite_foods));
          }
        } catch { /* Keep the form usable when browser storage is unavailable. */ }
      }, 0);
      return () => window.clearTimeout(draftTimer);
    }
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) { window.location.replace(`${basePath}/login/?next=%2Fabout-you%2F`); return; }
      const metadata = data.user.user_metadata;
      setUser(data.user);
      setBranch(String(metadata.profile_branch_category ?? metadata.profile_branch ?? ""));
      setOtherBranch(String(metadata.profile_branch_details ?? ""));
      setExperience(String(metadata.profile_experience ?? ""));
      setSkills(readArray(metadata.profile_skills));
      const savedInterests = readArray(metadata.profile_interests);
      const oldTech = savedInterests.filter((item) => allTechnologyOptions.has(item));
      setTechnologies([...new Set([...readArray(metadata.profile_technologies), ...oldTech])]);
      const remainingInterests = savedInterests.filter((item) => !allTechnologyOptions.has(item));
      setInterests(remainingInterests.filter((item) => allInterestOptions.has(item)));
      setCustomInterests(remainingInterests.filter((item) => !allInterestOptions.has(item)));
      setCulture(readArray(metadata.profile_culture));
      setFoods(readArray(metadata.profile_favorite_foods));
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
    if (!interests.length && !customInterests.length) { setError("Choose at least one interest to continue."); return; }
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
          profile_interests: [...interests, ...customInterests],
          profile_culture: culture,
          profile_favorite_foods: foods,
        }));
        setSaved(true);
      } catch { setError("Your browser couldn’t save this draft. Check its storage settings and try again."); }
      return;
    }
    setBusy(true);
    const { data, error: updateError } = await supabase.auth.updateUser({ data: {
      profile_branch: branch === "Other" ? otherBranch.trim() : branch,
      profile_branch_category: branch,
      profile_branch_details: branch === "Other" ? otherBranch.trim() : "",
      profile_experience: experience,
      profile_skills: skills,
      profile_technologies: technologies,
      profile_interests: [...interests, ...customInterests],
      profile_culture: culture,
      profile_favorite_foods: foods,
      profile_complete: true,
    } });
    setBusy(false);
    if (updateError) { setError("We couldn’t save your details. Check your connection and try again."); return; }
    if (data.user) setUser(data.user);
    setSaved(true);
  }

  const previewName = String(user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email?.split("@")[0] ?? "Your profile");
  const selectedInterests = [...interests, ...customInterests];
  const normalizedInterestSearch = interestSearch.trim().toLocaleLowerCase();
  const filteredInterestGroups = interestGroups.map((group) => ({ ...group, tags: group.tags.filter((tag) => tag.toLocaleLowerCase().includes(normalizedInterestSearch)) })).filter((group) => group.tags.length > 0);
  const selectedCount = skills.length + technologies.length + selectedInterests.length + culture.length + foods.length + Number(Boolean(branch && (branch !== "Other" || otherBranch.trim()))) + Number(Boolean(experience));

  return <main className={styles.page}>
    <header className={styles.header}>
      <a className={styles.brand} href={`${basePath}/`} aria-label="Collexus home"><span className={styles.logoFrame}><Image src={`${basePath}/collexus-logo.svg`} alt="" width={32} height={32} /></span><span>Collexus</span></a>
      <a className={styles.backLink} href={`${basePath}/`}><ArrowLeft size={16} aria-hidden="true" /> Back to events</a>
    </header>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}><Sparkles size={14} aria-hidden="true" /> YOUR COLLEXUS PROFILE</p><h1>Show them what<br /><em>makes you, you.</em></h1><p className={styles.heroText}>Share your skills, study details, interests, technologies, culture and favorite foods. Find your people, your next team and more events that feel like you.</p><div className={styles.privacyPill}><ShieldCheck size={15} aria-hidden="true" /> You choose what to share</div></div>
        <aside className={styles.heroCard}><div className={styles.heroCardIcon}><CircleUserRound size={23} aria-hidden="true" /></div><p>YOUR PROFILE, YOUR WAY</p><strong>A little detail can spark a great connection.</strong><span>Update these details whenever you like.</span></aside>
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
          <section className={styles.profileSection} aria-labelledby="interest-title"><div className={styles.groupHeading}><div><p className={styles.sectionKicker}>04 — WHAT YOU LOVE</p><h2 id="interest-title">Pick your interests <small>* choose at least one</small></h2></div><span className={styles.countBadge}>{selectedInterests.length} selected</span></div>
            <label className={styles.interestSearch}><Search size={16} aria-hidden="true" /><input type="search" value={interestSearch} onChange={(event) => setInterestSearch(event.target.value)} placeholder="Search interests" aria-label="Search interest categories" /></label>
            <div className={styles.groups}>{filteredInterestGroups.map((group) => <fieldset className={`${styles.interestGroup} ${styles[group.tone]}`} key={group.name}><legend>{group.name}</legend><div className={styles.chips}>{group.tags.map((tag) => { const selected = interests.includes(tag); return <button type="button" className={selected ? styles.chipSelected : styles.chip} aria-pressed={selected} key={tag} onClick={() => { setInterests((current) => selected ? current.filter((item) => item !== tag) : [...current, tag]); setSaved(false); }}>{selected && <Check size={13} aria-hidden="true" />}{tag}</button>; })}</div></fieldset>)}{!filteredInterestGroups.length && <p className={styles.noResults}>No matching interests. Add your own below.</p>}</div>
            <TagField id="custom-interest-entry" label="Add your own interests" hint="Optional · type a tag and press Enter" values={customInterests} draft={interestDraft} setDraft={setInterestDraft} onAdd={(value) => addValue(value, customInterests, setCustomInterests, () => setInterestDraft(""))} onRemove={(value) => { setCustomInterests((current) => current.filter((item) => item !== value)); setSaved(false); }} placeholder="Add a topic that’s not listed" />
          </section>
          <section className={styles.profileSection} aria-labelledby="culture-title"><div className={styles.groupHeading}><div><p className={styles.sectionKicker}>05 — YOUR CULTURE</p><h2 id="culture-title">Culture, languages & communities</h2></div></div>
            <TagField id="culture-entry" label="Culture, languages & communities" hint="Optional · add what feels like you" values={culture} draft={cultureDraft} setDraft={setCultureDraft} onAdd={(value) => addValue(value, culture, setCulture, () => setCultureDraft(""))} onRemove={(value) => { setCulture((current) => current.filter((item) => item !== value)); setSaved(false); }} placeholder="e.g. Telugu, classical dance, anime" suggestions={cultureSuggestions} />
          </section>
          <section className={styles.profileSection} aria-labelledby="food-title"><div className={styles.groupHeading}><div><p className={styles.sectionKicker}>06 — FOOD FAVOURITES</p><h2 id="food-title">Loved food items</h2></div></div>
            <TagField id="food-entry" label="Loved food items" hint="Optional · help friends plan the next food run" values={foods} draft={foodDraft} setDraft={setFoodDraft} onAdd={(value) => addValue(value, foods, setFoods, () => setFoodDraft(""))} onRemove={(value) => { setFoods((current) => current.filter((item) => item !== value)); setSaved(false); }} placeholder="Add a favorite food" suggestions={foodSuggestions} />
          </section>
          {error && <p className={styles.error} role="alert">{error}</p>}{saved && <p className={styles.success} role="status"><BadgeCheck size={17} aria-hidden="true" /> Your profile details are saved.</p>}
          {!configured && <p className={styles.setupNotice}><ShieldCheck size={16} aria-hidden="true" /> Your profile service isn’t connected yet. You can still fill out the page, preview your profile, and save a draft in this browser.</p>}
          <div className={styles.actions}><button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> Saving…</> : <>{configured ? "Save my details" : "Save this draft"} <ArrowRight size={17} aria-hidden="true" /></>}</button><a href={`${basePath}/#featured-events`}>Maybe later</a></div>
        </form>
        <aside className={styles.preview} aria-label="Live profile preview"><div className={styles.previewTop}><span>YOUR PROFILE CARD</span><span className={styles.live}><i /> LIVE PREVIEW</span></div><div className={styles.previewBody}><div className={styles.avatar}>{previewName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "C"}</div><span className={styles.memberBadge}>{user ? "COLLEXUS MEMBER" : "PROFILE PREVIEW"}</span><h3>{previewName}</h3>{user?.email && <p className={styles.email}>{user.email}</p>}<div className={styles.divider} /><p className={styles.previewLabel}><GraduationCap size={14} aria-hidden="true" /> STUDYING</p><p className={styles.previewValue}>{branch || "Your branch"}</p><p className={styles.previewMeta}>{experience || "Your year / experience"}</p><p className={styles.previewLabel}><Sparkles size={14} aria-hidden="true" /> SKILLS</p><div className={styles.previewChips}>{skills.length ? skills.slice(0, 5).map((item) => <span key={item}>{item}</span>) : <small>Add skills to show them here</small>}</div><p className={styles.previewLabel}><Sparkles size={14} aria-hidden="true" /> TECHNOLOGIES</p><div className={styles.previewChips}>{technologies.length ? technologies.slice(0, 5).map((item) => <span key={item}>{item}</span>) : <small>Add tools and technologies</small>}</div><p className={styles.previewLabel}><Heart size={14} aria-hidden="true" /> INTERESTS</p><div className={styles.previewChips}>{selectedInterests.length ? selectedInterests.slice(0, 5).map((item) => <span key={item}>{item}</span>) : <small>Choose what you enjoy</small>}</div>{culture.length > 0 && <><p className={styles.previewLabel}><Sparkles size={14} aria-hidden="true" /> CULTURE</p><div className={styles.previewChips}>{culture.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div></>}{foods.length > 0 && <><p className={styles.previewLabel}><Heart size={14} aria-hidden="true" /> FOOD FAVOURITES</p><div className={styles.previewChips}>{foods.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div></>}</div><div className={styles.previewFoot}><ShieldCheck size={16} aria-hidden="true" /><span>Share only what you’re comfortable sharing.</span></div></aside>
      </div>}
      <footer className={styles.footer}><span>© 2026 Collexus</span><span>Find your people. Find your next experience.</span></footer>
    </div>
  </main>;
}
