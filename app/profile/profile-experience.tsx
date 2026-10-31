"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check,
  ChevronDown, CircleUserRound, Compass, Heart, ImagePlus,
  LoaderCircle, Plus, ShieldCheck, Trash2, X,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase-client";
import { getUserProfile, updateUserProfile } from "../../lib/user-profile";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import styles from "./profile.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const localDraftKey = "collexus:account-profile-draft";
const domains = ["Artificial intelligence & data", "Web & app development", "Robotics & IoT", "Cybersecurity", "Design & creative media", "Business & entrepreneurship", "Research & academia", "Mechanical & manufacturing", "Electrical & electronics", "Other"];
const skillsList = ["Communication", "Leadership", "Problem solving", "JavaScript", "Python", "UI/UX design", "Public speaking", "Project management", "Teamwork", "Data analysis", "Research", "Critical thinking", "Graphic design", "Content writing", "Event planning", "Time management", "Presentation design", "Video editing", "Photography", "C++", "Java", "SQL", "Web development", "Git & GitHub", "Figma", "Prototyping", "Digital marketing", "Product thinking"];
const interestsList = ["Hackathons", "Workshops", "Design", "Technology", "Volunteering", "Research", "Entrepreneurship", "Arts & culture", "Sports", "Community", "Music", "Dance", "Photography", "Gaming", "Reading", "Creative writing", "Film & cinema", "Travel", "Fitness", "Debate", "Open source", "Robotics", "Startups", "Sustainability", "Mentoring", "Theatre", "Fashion", "Cooking", "Animation", "Social impact", "Public speaking", "Product design", "Board games"];

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function ProfileExperience() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [profileReady, setProfileReady] = useState(false);
  const [configured] = useState(isSupabaseConfigured);
  const [accountType, setAccountType] = useState("member");
  const [name, setName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [campusId, setCampusId] = useState("");
  const [organization, setOrganization] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPath, setAvatarPath] = useState("");
  const [domain, setDomain] = useState("");
  const [otherDomain, setOtherDomain] = useState("");
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
    if (!supabase) {
      try {
        const stored = window.localStorage.getItem(localDraftKey);
        if (stored) {
          const draft = JSON.parse(stored) as Record<string, unknown>;
          if (typeof draft.full_name === "string") setName(draft.full_name);
          if (typeof draft.email === "string") setEmailAddress(draft.email);
          if (typeof draft.account_type === "string") setAccountType(draft.account_type);
          if (typeof draft.profile_phone === "string") setPhone(draft.profile_phone);
          if (typeof draft.campus_id === "string") setCampusId(draft.campus_id);
          if (typeof draft.profile_organization === "string") setOrganization(draft.profile_organization);
          if (typeof draft.profile_address === "string") setAddress(draft.profile_address);
          if (typeof draft.profile_avatar_url === "string") setAvatarUrl(draft.profile_avatar_url);
          if (typeof draft.profile_domain === "string") {
            const savedDomain = draft.profile_domain;
            setDomain(domains.includes(savedDomain) ? savedDomain : savedDomain ? "Other" : "");
            setOtherDomain(domains.includes(savedDomain) ? "" : savedDomain);
          }
          setSkills(readStringArray(draft.profile_skills));
          setInterests(readStringArray(draft.profile_interests));
          if (typeof draft.profile_about === "string") setAbout(draft.profile_about);
        }
      } catch {
        window.localStorage.removeItem(localDraftKey);
      }
      setProfileReady(true);
      setChecking(false);
      return () => { active = false; };
    }
    void supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        window.location.replace(`${basePath}/login/`);
        return;
      }
      const current = data.user;
      const metadata = current.user_metadata;
      setUser(current);
      const { profile, error: profileError } = await getUserProfile(supabase, current.id);
      if (!active) return;
      if (profileError || !profile) {
        setError("Profile storage isn’t ready yet. Apply the Collexus profiles migration, then refresh this page.");
        setChecking(false);
        return;
      }
      setName(profile.full_name ?? String(metadata.full_name ?? metadata.name ?? ""));
      setEmailAddress(current.email ?? "");
      setAccountType(profile.account_type ?? String(metadata.account_type ?? "student"));
      setPhone(profile.profile_phone ?? String(metadata.phone_number ?? current.phone ?? ""));
      setCampusId(profile.campus_id ?? String(metadata.campus_id ?? ""));
      setOrganization(profile.profile_organization ?? "");
      setAddress(profile.profile_address ?? "");
      const savedAvatar = profile.profile_avatar_url ?? String(metadata.avatar_url ?? "");
      if (savedAvatar.startsWith("http") || savedAvatar.startsWith("data:")) setAvatarUrl(savedAvatar);
      else if (savedAvatar) {
        setAvatarPath(savedAvatar);
        const { data: signedPhoto } = await supabase.storage.from("profile-photos").createSignedUrl(savedAvatar, 3600);
        if (active) setAvatarUrl(signedPhoto?.signedUrl ?? "");
      }
      const savedDomain = profile.profile_domain ?? "";
      setDomain(savedDomain && !domains.includes(savedDomain) ? "Other" : savedDomain);
      setOtherDomain(savedDomain && !domains.includes(savedDomain) ? savedDomain : "");
      setSkills(readStringArray(profile.profile_skills));
      setInterests(readStringArray(profile.profile_interests));
      setAbout(profile.profile_about ?? "");
      setProfileReady(true);
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

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPEG, PNG or WebP image up to 5 MB.");
      return;
    }
    setError("");
    setSaved(false);
    let optimizedPhoto: Blob | null = null;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 420 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      optimizedPhoto = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", .82));
    } catch {
      setError("We couldn’t prepare that image. Choose another photo and try again.");
      return;
    }
    if (!optimizedPhoto) {
      setError("We couldn’t prepare that image. Choose another photo and try again.");
      return;
    }
    const supabase = getSupabaseClient();
    if (supabase && user) {
      setBusy(true);
      const path = `${user.id}/profile.jpg`;
      const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, optimizedPhoto, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (uploadError) {
        setError("We couldn’t upload your photo. Apply the profile photo storage migration and try again.");
        setBusy(false);
        return;
      }
      const { data: signedPhoto, error: signedError } = await supabase.storage.from("profile-photos").createSignedUrl(path, 3600);
      setBusy(false);
      if (signedError || !signedPhoto) {
        setError("Your photo uploaded, but its preview couldn’t be created. Refresh this page to try again.");
        return;
      }
      setAvatarPath(path);
      setAvatarUrl(signedPhoto.signedUrl);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPath("");
        setAvatarUrl(reader.result);
      }
    };
    reader.onerror = () => setError("We couldn’t read that image. Choose another photo and try again.");
    reader.readAsDataURL(optimizedPhoto);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const domainValue = domain === "Other" ? otherDomain.trim() : domain;
    if (!domainValue) {
      setError("Choose your main area of interest to continue.");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      try {
        window.localStorage.setItem(localDraftKey, JSON.stringify({
          full_name: name.trim(), email: emailAddress.trim(), account_type: accountType,
          profile_phone: phone.trim(), campus_id: campusId.trim(), profile_organization: organization.trim(),
          profile_address: address.trim(), profile_avatar_url: avatarUrl.trim(), profile_domain: domainValue,
          profile_skills: skills, profile_interests: interests, profile_about: about.trim(),
        }));
        setSaved(true);
      } catch {
        setError("This browser couldn’t save your profile draft. Check available site storage and try again.");
      }
      return;
    }
    if (!user) {
      setError("Sign in to save your profile details.");
      return;
    }
    setBusy(true);
    const { profile, error: updateError } = await updateUserProfile(supabase, user.id, {
      full_name: name.trim(),
      profile_phone: phone.trim(),
      campus_id: campusId.trim(),
      profile_organization: organization.trim(),
      profile_address: address.trim(),
      profile_avatar_url: avatarPath || avatarUrl.trim(),
      profile_domain: domainValue,
      profile_skills: skills,
      profile_interests: interests,
      profile_about: about.trim(),
      profile_complete: true,
    });
    setBusy(false);
    if (updateError || !profile) {
      setError("We couldn’t save your profile. Check your connection and try again.");
      return;
    }
    setSaved(true);
  }

  const contactEmail = emailAddress || user?.email || "";
  const displayName = name.trim() || user?.email?.split("@")[0] || "Your profile";
  const accountLabel = accountType === "guest" ? "Campus guest" : accountType === "faculty" ? "Faculty" : "Student";
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={`${styles.brand} collexus-brand`} href={`${basePath}/`} aria-label="Collexus home">
          <CollexusHomeLogo basePath={basePath} />
        </a>
        <a className={styles.backLink} href={`${basePath}/profile/`}><ArrowLeft size={16} aria-hidden="true" /> Back to profile</a>
      </header>

      <div className={styles.shell}>
        {checking ? (
          <div className={styles.loading}><LoaderCircle size={22} aria-hidden="true" /> Checking your account…</div>
        ) : !user && configured ? (
          <section className={styles.noticeCard}>
            <ShieldCheck size={22} aria-hidden="true" />
            <div><h2>{configured ? "Sign in to create your profile" : "Account setup is almost ready"}</h2><p>{configured ? "We’ll take you to sign in, then bring you right back here." : "Supabase needs a project URL and publishable key before an account can be loaded or saved."}</p><a className={styles.primaryButton} href={`${basePath}/login/`}>Go to sign in <ArrowRight size={17} aria-hidden="true" /></a></div>
          </section>
        ) : configured && !profileReady ? (
          <section className={styles.noticeCard}>
            <ShieldCheck size={22} aria-hidden="true" />
            <div><h2>Profile storage isn’t ready yet</h2><p>{error || "Apply the Collexus profiles migration, then refresh this page."}</p><a className={styles.primaryButton} href={`${basePath}/#featured-events`}>Back to events <ArrowRight size={17} aria-hidden="true" /></a></div>
          </section>
        ) : (
          <div className={styles.editorShell}>
            <form className={styles.form} id="profile" onSubmit={saveProfile}>
              <div className={styles.formHeading}>
                <span className={styles.headingIcon}><CircleUserRound size={20} aria-hidden="true" /></span>
                <div><p className={styles.sectionKicker}>PROFILE DETAILS</p><h2>About you</h2><p>Account details are filled from sign-up. Add the rest whenever you’re ready.</p></div>
              </div>

              <section className={styles.profileGroup} id="personal-heading" aria-labelledby="personal-heading">
                <div className={styles.groupTitle}><span className={styles.sectionKicker}>01 · PERSONAL</span><h3 id="personal-heading">Personal details</h3></div>
                <div className={styles.photoField}>
                  <div className={styles.photoCircle}>{avatarUrl ? <img src={avatarUrl} alt="Your selected profile" /> : <CircleUserRound size={29} aria-hidden="true" />}</div>
                  <div className={styles.photoCopy}><strong>Profile picture</strong><small>JPEG, PNG or WebP up to 5 MB. It will be cropped into a circle.</small>
                    <label className={styles.photoButton}><ImagePlus size={15} aria-hidden="true" /> {busy ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}<input className={styles.photoFileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} disabled={busy} /></label>
                  </div>
                  {avatarUrl && <button className={styles.photoRemove} type="button" onClick={() => { setAvatarUrl(""); setAvatarPath(""); setSaved(false); }}><Trash2 size={14} aria-hidden="true" /> Remove</button>}
                </div>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}><span>Full name</span><input autoComplete="name" maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} placeholder="Your name" /></label>
                  <label className={styles.field}><span>Email address <small>{user ? "Sign-in email" : "Optional preview detail"}</small></span><input autoComplete="email" type="email" maxLength={254} value={contactEmail} onChange={(event) => { if (!user) setEmailAddress(event.target.value); }} readOnly={Boolean(user)} placeholder={user ? "Signed-in email" : "you@example.com"} /></label>
                  <label className={styles.field}><span>Phone number</span><input autoComplete="tel" inputMode="tel" maxLength={24} value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false); }} placeholder="Add a phone number" /></label>
                  <label className={styles.field}><span>Account type</span><input value={accountLabel} readOnly /></label>
                  <label className={`${styles.field} ${styles.fieldWide}`}><span>Address <small>Optional</small></span><input autoComplete="street-address" maxLength={240} value={address} onChange={(event) => { setAddress(event.target.value); setSaved(false); }} placeholder="City, state or address" /></label>
                </div>
              </section>

              <section className={styles.profileGroup} id="education-heading" aria-labelledby="education-heading">
                <div className={styles.groupTitle}><span className={styles.sectionKicker}>02 · CAMPUS</span><h3 id="education-heading">College & organization</h3></div>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}><span>College / organization ID <small>Required</small></span><input autoComplete="off" maxLength={100} value={campusId} onChange={(event) => { setCampusId(event.target.value); setSaved(false); }} placeholder="Your college, campus or organization ID" required /></label>
                  <label className={styles.field}><span>College / organization</span><input autoComplete="organization" maxLength={140} value={organization} onChange={(event) => { setOrganization(event.target.value); setSaved(false); }} placeholder="College, club or organization" /></label>
                </div>
                <small className={styles.profileHint}>Campus ID and organization are self-reported and don’t verify enrollment.</small>
              </section>

              <section className={styles.profileGroup} id="interests-heading" aria-labelledby="interests-heading">
              <div className={styles.groupTitle}><span className={styles.sectionKicker}>03 · YOUR DIRECTION</span><h3 id="interests-heading">Interests, skills & domain</h3></div>
              <div className={styles.field}>
                <span id="profile-domain-label">Which domain are you in? <small>Required</small></span>
                <span className={styles.selectWrap}><Compass size={17} aria-hidden="true" /><select aria-labelledby="profile-domain-label" value={domain} onChange={(event) => { const value = event.target.value; setDomain(value); if (value !== "Other") setOtherDomain(""); setSaved(false); }} required>
                  <option value="">Choose your main domain</option>{domains.map((item) => <option key={item} value={item}>{item}</option>)}
                </select><ChevronDown size={16} aria-hidden="true" /></span>
                <small>Pick the area you study, work in or want to explore.</small>
                {domain === "Other" && <div className={styles.customDomainField}>
                  <label htmlFor="profile-domain-other">Tell us your area <small>Required</small></label>
                  <input id="profile-domain-other" autoComplete="off" maxLength={80} value={otherDomain} onChange={(event) => { setOtherDomain(event.target.value); setSaved(false); }} placeholder="e.g. AIML, BBA or MBA" required />
                </div>}
              </div>

              <fieldset className={styles.fieldset}>
                <legend>Skills <small>Choose a few or add your own</small></legend>
                <div className={styles.chipInput}>
                  {skills.map((skill) => <span className={styles.skillChip} key={skill}>{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => { setSkills((current) => current.filter((item) => item !== skill)); setSaved(false); }}><X size={13} aria-hidden="true" /></button></span>)}
                  <input aria-label="Add a skill" value={skillDraft} maxLength={32} onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={handleSkillKey} onBlur={() => { if (skillDraft.trim()) addSkill(skillDraft); }} placeholder={skills.length ? "Add another skill…" : "Type a skill and press Enter"} />
                  <button className={styles.addSkill} type="button" aria-label="Add skill" onClick={() => addSkill(skillDraft)}><Plus size={16} aria-hidden="true" /></button>
                </div>
                <div className={styles.suggestions} aria-label="Suggested skills">{skillsList.filter((item) => !skills.includes(item)).slice(0, 12).map((item) => <button type="button" key={item} onClick={() => addSkill(item)} disabled={skills.length >= 10}>{item}<Plus size={12} aria-hidden="true" /></button>)}</div>
                <small>Up to 10 skills. Press Enter or comma to add one.</small>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend>Personal interests <small>Pick as many as you like</small></legend>
                <div className={styles.interestGrid}>{interestsList.map((item) => {
                  const selected = interests.includes(item);
                  return <button type="button" key={item} aria-pressed={selected} className={selected ? styles.interestSelected : styles.interest} onClick={() => toggleInterest(item)}>{selected && <Check size={13} aria-hidden="true" />}{item}</button>;
                })}</div>
              </fieldset>

              <label className={styles.field} id="about">
                <span>About you <small>Optional</small></span>
                <textarea value={about} onChange={(event) => { setAbout(event.target.value); setSaved(false); }} maxLength={280} rows={4} placeholder="A few lines about what you’re learning, building or hoping to meet…" />
                <small className={styles.counter}>{about.length}/280 · Keep it friendly and brief</small>
              </label>
              </section>

              {error && <p className={styles.error} role="alert">{error}</p>}
              {saved && <p className={styles.success} role="status"><BadgeCheck size={17} aria-hidden="true" /> {configured ? "Profile saved to your account." : "Profile draft saved on this device."} <a href={`${basePath}/profile/`}>View profile</a></p>}
              {!configured && <p className={styles.setupNotice}><ShieldCheck size={16} aria-hidden="true" /> Preview mode: profile edits save on this device. Connect an account service to sync details between devices.</p>}

              <div className={styles.formActions}>
                <button className={styles.primaryButton} type="submit" disabled={busy || (configured && !profileReady)}>{busy ? <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> Saving profile…</> : <>{configured ? "Save profile" : "Save profile draft"} <ArrowRight size={17} aria-hidden="true" /></>}</button>
                <a href={`${basePath}/#featured-events`}>I’ll do this later</a>
              </div>
            </form>

          </div>
        )}

        <footer className={styles.footer}><span>© 2026 Collexus</span><span>Campus events, in one place.</span></footer>
      </div>
    </main>
  );
}
