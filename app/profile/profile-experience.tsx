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

function normalizePhoneNumber(value: string) {
  return value.trim().replace(/[\s().-]/g, "");
}

function isInternationalPhoneNumber(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function phoneAuthErrorMessage(error: unknown) {
  const details = typeof error === "object" && error !== null ? error as { code?: unknown; message?: unknown } : {};
  const code = typeof details.code === "string" ? details.code : "";
  const message = typeof details.message === "string" ? details.message.toLowerCase() : "";
  if (code === "phone_exists") return "This number is already connected to another Collexus account.";
  if (code === "over_sms_send_rate_limit") return "Too many codes were requested. Wait a little before trying again.";
  if (code === "phone_provider_disabled" || code === "sms_provider_disabled" || code === "sms_send_failed" || message.includes("sms provider") || message.includes("phone change") || message.includes("twilio")) return "SMS verification isn’t configured for this project yet. Ask the Collexus administrator to enable an SMS provider in Supabase.";
  if (code === "otp_expired") return "That code has expired. Request a new SMS code.";
  if (code === "otp_invalid" || code === "token_not_found") return "That code doesn’t match. Check the SMS and try again.";
  return "We couldn’t verify this number. Check the number and try again.";
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
  const [pendingPhoneVerification, setPendingPhoneVerification] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneResendSeconds, setPhoneResendSeconds] = useState(0);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
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
      setPhone(current.phone_confirmed_at && current.phone ? current.phone : profile.profile_phone ?? String(metadata.phone_number ?? current.phone ?? ""));
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

  useEffect(() => {
    if (!phoneResendSeconds) return;
    const timer = window.setTimeout(() => setPhoneResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [phoneResendSeconds]);

  const phoneVerified = Boolean(user?.phone_confirmed_at && normalizePhoneNumber(user.phone ?? "") === normalizePhoneNumber(phone));

  async function sendPhoneVerification() {
    const supabase = getSupabaseClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    setPhoneError("");
    setPhoneMessage("");
    if (!isInternationalPhoneNumber(normalizedPhone)) {
      setPhoneError("Enter a phone number with its country code, such as +91 98765 43210.");
      return;
    }
    if (!supabase || !user) {
      setPhoneError("Sign in to verify a phone number with SMS.");
      return;
    }
    if (user.phone_confirmed_at && normalizePhoneNumber(user.phone ?? "") === normalizedPhone) {
      setPhoneMessage("This number is already verified for your account.");
      return;
    }

    setPhoneBusy(true);
    try {
      if (pendingPhoneVerification === normalizedPhone) {
        const { error: resendError } = await supabase.auth.resend({ type: "phone_change", phone: normalizedPhone });
        if (resendError) throw resendError;
        setPhoneMessage(`A new verification code was sent to ${normalizedPhone}.`);
      } else {
        const { error: sendError } = await supabase.auth.updateUser({ phone: normalizedPhone });
        if (sendError) throw sendError;
        setPendingPhoneVerification(normalizedPhone);
        setPhoneOtp("");
        setPhoneMessage(`A 6-digit verification code was sent to ${normalizedPhone} by SMS.`);
      }
      setPhoneResendSeconds(60);
    } catch (authError) {
      setPhoneError(phoneAuthErrorMessage(authError));
    } finally {
      setPhoneBusy(false);
    }
  }

  async function verifyPhoneNumber() {
    const supabase = getSupabaseClient();
    const token = phoneOtp.trim();
    setPhoneError("");
    setPhoneMessage("");
    if (!supabase || !user || !pendingPhoneVerification) {
      setPhoneError("Request a new SMS code before verifying your number.");
      return;
    }
    if (!/^\d{6}$/.test(token)) {
      setPhoneError("Enter the 6-digit code from your SMS.");
      return;
    }

    setPhoneBusy(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ phone: pendingPhoneVerification, token, type: "phone_change" });
      if (verifyError) throw verifyError;
      const verifiedUser = data.user ?? user;
      setUser(verifiedUser);
      setPhone(pendingPhoneVerification);
      setPendingPhoneVerification("");
      setPhoneOtp("");
      setPhoneResendSeconds(0);

      const { data: metadataData, error: metadataError } = await supabase.auth.updateUser({ data: { phone_number: pendingPhoneVerification } });
      if (!metadataError && metadataData.user) setUser(metadataData.user);
      const { error: profileError } = await updateUserProfile(supabase, user.id, { profile_phone: pendingPhoneVerification });
      const profileErrorText = profileError?.message.toLowerCase() ?? "";
      setPhoneMessage(profileError
        ? profileErrorText.includes("profile_phone") || profileErrorText.includes("column")
          ? "Phone verified by SMS. Your account has the verified number; syncing the profile field needs the profile contact fields migration."
          : "Phone verified by SMS, but the profile field did not sync. Save your profile again after checking your connection."
        : "Phone number verified by SMS and saved to your account.");
    } catch (authError) {
      setPhoneError(phoneAuthErrorMessage(authError));
    } finally {
      setPhoneBusy(false);
    }
  }

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
      const bucket = supabase.storage.from("profile-photos");
      const path = `${user.id}/${crypto.randomUUID()}-profile.jpg`;
      try {
        const { error: uploadError } = await bucket.upload(path, optimizedPhoto, { contentType: "image/jpeg", cacheControl: "3600" });
        if (uploadError) {
          const message = uploadError.message.toLowerCase();
          setError(message.includes("bucket not found")
            ? "Collexus photo storage isn’t set up yet. Apply the profile photo storage migration in Supabase, then retry."
            : message.includes("row-level security") || message.includes("not allowed")
              ? "Your account can’t upload to its photo folder yet. Apply the profile photo storage policies in Supabase."
              : "We couldn’t upload your photo. Check your connection and try again.");
          return;
        }

        const { profile, error: profileError } = await updateUserProfile(supabase, user.id, { profile_avatar_url: path });
        if (profileError || !profile) {
          await bucket.remove([path]);
          const message = profileError?.message.toLowerCase() ?? "";
          setError(message.includes("profile_avatar_url") || message.includes("column")
            ? "The profile photo field is missing from the Collexus database. Apply the profile contact fields migration, then retry."
            : "The photo uploaded but couldn’t be connected to your profile. Try again after checking your connection.");
          return;
        }

        const { data: signedPhoto, error: signedError } = await bucket.createSignedUrl(path, 3600);
        if (signedError || !signedPhoto) {
          setAvatarPath(path);
          setAvatarUrl("");
          setSaved(true);
          setError("Your photo is saved to your profile, but its preview couldn’t be loaded. Refresh this page to retry.");
          return;
        }

        if (avatarPath && avatarPath !== path && !avatarPath.startsWith("http") && !avatarPath.startsWith("data:")) {
          await bucket.remove([avatarPath]);
        }
        setAvatarPath(path);
        setAvatarUrl(signedPhoto.signedUrl);
        setSaved(true);
      } catch {
        setError("We couldn’t finish uploading your photo. Check your connection and try again.");
      } finally {
        setBusy(false);
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPath("");
        setAvatarUrl(reader.result);
        try {
          const currentDraft = JSON.parse(window.localStorage.getItem(localDraftKey) ?? "{}") as Record<string, unknown>;
          window.localStorage.setItem(localDraftKey, JSON.stringify({ ...currentDraft, profile_avatar_url: reader.result }));
          setSaved(true);
        } catch {
          setError("Your photo preview is ready, but this browser couldn’t save it. Save your profile draft to retry.");
        }
      }
    };
    reader.onerror = () => setError("We couldn’t read that image. Choose another photo and try again.");
    reader.readAsDataURL(optimizedPhoto);
  }

  async function removeAvatar() {
    const supabase = getSupabaseClient();
    if (supabase && user) {
      setBusy(true);
      const { error: updateError } = await updateUserProfile(supabase, user.id, { profile_avatar_url: null });
      if (updateError) {
        setError("We couldn’t remove the saved profile photo. Try again after checking your connection.");
        setBusy(false);
        return;
      }
      if (avatarPath && !avatarPath.startsWith("http") && !avatarPath.startsWith("data:")) {
        await supabase.storage.from("profile-photos").remove([avatarPath]);
      }
      setBusy(false);
    } else {
      try {
        const currentDraft = JSON.parse(window.localStorage.getItem(localDraftKey) ?? "{}") as Record<string, unknown>;
        window.localStorage.setItem(localDraftKey, JSON.stringify({ ...currentDraft, profile_avatar_url: "" }));
      } catch {
        setError("This browser couldn’t update your profile draft. Try again.");
        return;
      }
    }
    setAvatarUrl("");
    setAvatarPath("");
    setSaved(true);
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
                  {avatarUrl && <button className={styles.photoRemove} type="button" disabled={busy} onClick={() => void removeAvatar()}><Trash2 size={14} aria-hidden="true" /> Remove</button>}
                </div>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}><span>Full name</span><input autoComplete="name" maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} placeholder="Your name" /></label>
                  <label className={styles.field}><span>Email address <small>{user ? "Sign-in email" : "Optional preview detail"}</small></span><input autoComplete="email" type="email" maxLength={254} value={contactEmail} onChange={(event) => { if (!user) setEmailAddress(event.target.value); }} readOnly={Boolean(user)} placeholder={user ? "Signed-in email" : "you@example.com"} /></label>
                  <div className={styles.field}>
                    <label className={styles.phoneLabel} htmlFor="profile-phone"><span>Phone number</span>{phoneVerified && <span className={styles.phoneVerified}><BadgeCheck size={13} aria-hidden="true" /> Verified</span>}</label>
                    <div className={styles.phoneInputRow}>
                      <input id="profile-phone" autoComplete="tel" inputMode="tel" maxLength={24} value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false); setPendingPhoneVerification(""); setPhoneOtp(""); setPhoneResendSeconds(0); setPhoneError(""); setPhoneMessage(""); }} placeholder="+91 98765 43210" />
                      <button className={styles.phoneAction} type="button" disabled={phoneBusy || busy || phoneVerified || !configured || !user} onClick={() => void sendPhoneVerification()}>{phoneBusy ? <><LoaderCircle className={styles.spinner} size={14} aria-hidden="true" /> Sending…</> : phoneVerified ? "Verified" : pendingPhoneVerification ? phoneResendSeconds ? `Resend in ${phoneResendSeconds}s` : "Resend SMS code" : "Verify by SMS"}</button>
                    </div>
                    {pendingPhoneVerification && <div className={styles.phoneCodePanel}>
                      <label htmlFor="profile-phone-code">Enter the 6-digit code sent to {pendingPhoneVerification}</label>
                      <div className={styles.phoneCodeRow}>
                        <input id="profile-phone-code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={phoneOtp} onChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" />
                        <button className={styles.phoneActionPrimary} type="button" disabled={phoneBusy || phoneOtp.length !== 6} onClick={() => void verifyPhoneNumber()}>{phoneBusy ? "Checking…" : "Verify number"}</button>
                        <button className={styles.phoneChangeButton} type="button" disabled={phoneBusy} onClick={() => { setPendingPhoneVerification(""); setPhoneOtp(""); setPhoneResendSeconds(0); setPhoneError(""); setPhoneMessage(""); }}>Change number</button>
                      </div>
                      {phoneResendSeconds > 0 && <small>You can request another SMS in {phoneResendSeconds}s.</small>}
                    </div>}
                    {phoneError && <small className={styles.phoneError} role="alert">{phoneError}</small>}
                    {phoneMessage && <small className={styles.phoneSuccess} role="status">{phoneMessage}</small>}
                    {!configured && <small>SMS verification is available after your Collexus account is connected.</small>}
                  </div>
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
