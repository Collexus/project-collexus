"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, GraduationCap, Heart, LoaderCircle, Mail, MapPin, Phone, Plus, ShieldCheck, UserRound } from "lucide-react";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { getUserProfile, type UserProfile } from "@/lib/user-profile";
import styles from "./profile-summary.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const localDraftKey = "collexus:account-profile-draft";

type ProfileDetails = {
  name: string;
  email: string;
  phone: string;
  campusId: string;
  organization: string;
  address: string;
  avatarUrl: string;
  accountType: string;
  domain: string;
  skills: string[];
  interests: string[];
  about: string;
};

const emptyProfile: ProfileDetails = {
  name: "", email: "", phone: "", campusId: "", organization: "", address: "", avatarUrl: "",
  accountType: "student", domain: "", skills: [], interests: [], about: "",
};

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function fromAuthAndProfile(user: User, profile: UserProfile | null): ProfileDetails {
  const metadata = user.user_metadata;
  return {
    name: profile?.full_name ?? asText(metadata.full_name ?? metadata.name),
    email: user.email ?? "",
    phone: profile?.profile_phone ?? asText(metadata.phone_number ?? user.phone),
    campusId: profile?.campus_id ?? asText(metadata.campus_id),
    organization: profile?.profile_organization ?? "",
    address: profile?.profile_address ?? "",
    avatarUrl: profile?.profile_avatar_url ?? asText(metadata.avatar_url),
    accountType: profile?.account_type ?? asText(metadata.account_type) ?? "student",
    domain: profile?.profile_domain ?? "",
    skills: asList(profile?.profile_skills),
    interests: asList(profile?.profile_interests),
    about: profile?.profile_about ?? "",
  };
}

function fromLocalDraft(draft: Record<string, unknown>): ProfileDetails {
  return {
    ...emptyProfile,
    name: asText(draft.full_name),
    email: asText(draft.email),
    phone: asText(draft.profile_phone),
    campusId: asText(draft.campus_id) || asText(draft.profile_organization_id),
    organization: asText(draft.profile_organization),
    address: asText(draft.profile_address),
    avatarUrl: asText(draft.profile_avatar_url),
    accountType: asText(draft.account_type) || "student",
    domain: asText(draft.profile_domain),
    skills: asList(draft.profile_skills),
    interests: asList(draft.profile_interests),
    about: asText(draft.profile_about),
  };
}

function Detail({ label, value, href }: { label: string; value: string; href: string }) {
  return <div className={styles.detail}><dt>{label}</dt><dd>{value || <a className={styles.addDetail} href={href}><Plus size={13} aria-hidden="true" /> Add {label.toLowerCase()} <ArrowRight size={13} aria-hidden="true" /></a>}</dd></div>;
}

export function ProfileSummary() {
  const [profile, setProfile] = useState<ProfileDetails>(emptyProfile);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isLocalDraft, setIsLocalDraft] = useState(!isSupabaseConfigured());
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    if (!supabase) {
      try {
        const stored = window.localStorage.getItem(localDraftKey);
        if (stored && active) setProfile(fromLocalDraft(JSON.parse(stored) as Record<string, unknown>));
      } catch {
        window.localStorage.removeItem(localDraftKey);
      }
      return () => { active = false; };
    }

    void supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        window.location.replace(`${basePath}/login/?next=${encodeURIComponent(`${basePath}/profile/`)}`);
        return;
      }
      const { profile: storedProfile, error: profileError } = await getUserProfile(supabase, data.user.id);
      if (!active) return;
      const details = fromAuthAndProfile(data.user, storedProfile);
      if (details.avatarUrl && !details.avatarUrl.startsWith("http") && !details.avatarUrl.startsWith("data:")) {
        const { data: signedPhoto } = await supabase.storage.from("profile-photos").createSignedUrl(details.avatarUrl, 3600);
        if (signedPhoto?.signedUrl) details.avatarUrl = signedPhoto.signedUrl;
      }
      if (!active) return;
      setProfile(details);
      setIsLocalDraft(false);
      if (profileError) setError("Some profile details couldn’t be loaded. You can still edit them here.");
      setLoading(false);
    }).catch(() => {
      if (active) {
        setError("We couldn’t load your account profile. Please refresh and try again.");
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) window.location.replace(`${basePath}/login/`);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const name = profile.name || "Your profile";
  const accountType = profile.accountType === "guest" ? "Campus guest" : profile.accountType === "faculty" ? "Faculty" : "Student";
  const completionItems = [profile.name, profile.email, profile.phone, profile.campusId, profile.organization, profile.address, profile.avatarUrl, profile.domain, profile.skills.length > 0, profile.interests.length > 0, profile.about];
  const completedItems = completionItems.filter(Boolean).length;
  const completion = Math.round((completedItems / completionItems.length) * 100);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={`${styles.brand} collexus-brand`} href={`${basePath}/`} aria-label="Collexus home"><CollexusHomeLogo basePath={basePath} /></a>
        <a className={styles.backLink} href={`${basePath}/#featured-events`}><ArrowLeft size={16} aria-hidden="true" /> Back to events</a>
      </header>
      <div className={styles.shell}>
        <article className={styles.profileCard}>
        <section className={styles.hero}>
          <div className={styles.identity}>
            <div className={styles.avatar}>{profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${name} profile`} /> : <span>{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "C"}</span>}</div>
            <div className={styles.identityCopy}><p className={styles.eyebrow}>COLLEXUS PROFILE</p><h1>{name}</h1><p>{profile.email || (isLocalDraft ? "Preview profile · saved on this device" : "Your campus profile")}</p>
              <div className={styles.completion} aria-label={`Profile completeness: ${completion}%`}><div className={styles.completionLabel}><span>Profile completeness</span><strong>{completion}%</strong></div><div className={styles.progressTrack} role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness"><span style={{ width: `${completion}%` }} /></div><small>{completedItems} of {completionItems.length} details added</small></div>
            </div>
          </div>
          <div className={styles.heroActions}><span className={styles.accountBadge}><BadgeCheck size={15} aria-hidden="true" /> {accountType}</span><a className={styles.editButton} href={`${basePath}/profile/edit/`}>Edit profile <ArrowRight size={16} aria-hidden="true" /></a></div>
        </section>

        {loading ? <div className={styles.loading}><LoaderCircle size={22} aria-hidden="true" /> Loading your profile…</div> : <>
          {error && <p className={styles.notice} role="status">{error}</p>}
          {isLocalDraft && <p className={styles.localNotice}><ShieldCheck size={16} aria-hidden="true" /> This profile draft is stored in this browser. Sign in to sync it with your Collexus account.</p>}
          <div className={styles.highlights} aria-label="Profile highlights">
            <div><span className={styles.highlightIcon}><BriefcaseBusiness size={16} aria-hidden="true" /></span><span className={styles.highlightCount}>{profile.skills.length.toString().padStart(2, "0")}</span><span className={styles.highlightLabel}>skills</span></div>
            <div><span className={styles.highlightIcon}><Heart size={16} aria-hidden="true" /></span><span className={styles.highlightCount}>{profile.interests.length.toString().padStart(2, "0")}</span><span className={styles.highlightLabel}>interests</span></div>
            <div><span className={styles.highlightIcon}><Building2 size={16} aria-hidden="true" /></span><span className={styles.highlightCount}>{[profile.campusId, profile.organization].filter(Boolean).length.toString().padStart(2, "0")}</span><span className={styles.highlightLabel}>campus details</span></div>
          </div>
          <div className={styles.grid}>
            <section className={styles.card} aria-labelledby="contact-heading">
              <div className={styles.cardHeading}><span><UserRound size={17} aria-hidden="true" /></span><div><p>PERSONAL</p><h2 id="contact-heading">Contact details</h2></div></div>
              <dl><Detail label="Email" value={profile.email} href={`${basePath}/profile/edit/#personal-heading`} /><Detail label="Phone number" value={profile.phone} href={`${basePath}/profile/edit/#personal-heading`} /><Detail label="Address" value={profile.address} href={`${basePath}/profile/edit/#personal-heading`} /></dl>
            </section>
            <section className={styles.card} aria-labelledby="campus-heading">
              <div className={styles.cardHeading}><span><Building2 size={17} aria-hidden="true" /></span><div><p>CAMPUS</p><h2 id="campus-heading">College & organization</h2></div></div>
              <dl><Detail label="College / organization ID" value={profile.campusId} href={`${basePath}/profile/edit/#education-heading`} /><Detail label="College / organization" value={profile.organization} href={`${basePath}/profile/edit/#education-heading`} /></dl>
              <p className={styles.helper}>Campus ID and organization are self-reported profile details.</p>
            </section>
            <section className={styles.card} aria-labelledby="focus-heading">
              <div className={styles.cardHeading}><span><GraduationCap size={17} aria-hidden="true" /></span><div><p>YOUR DIRECTION</p><h2 id="focus-heading">Domain, skills & interests</h2></div></div>
              <div className={styles.tagGroup}><h3><MapPin size={14} aria-hidden="true" /> Domain</h3>{profile.domain ? <span className={styles.domain}>{profile.domain}</span> : <a className={styles.emptyAction} href={`${basePath}/profile/edit/#interests-heading`}><span><strong>Your field, your focus</strong><small>Choose the area you study or want to explore.</small></span><ArrowRight size={16} aria-hidden="true" /></a>}</div>
              <div className={styles.tagGroup}><h3><BriefcaseBusiness size={14} aria-hidden="true" /> Skills</h3>{profile.skills.length ? <div className={styles.tags}>{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <a className={styles.emptyAction} href={`${basePath}/profile/edit/#interests-heading`}><span><strong>Show what you can do</strong><small>Add skills to help teammates find you.</small></span><ArrowRight size={16} aria-hidden="true" /></a>}</div>
              <div className={styles.tagGroup}><h3><Heart size={14} aria-hidden="true" /> Interests</h3>{profile.interests.length ? <div className={styles.tags}>{profile.interests.map((interest) => <span key={interest}>{interest}</span>)}</div> : <a className={styles.emptyAction} href={`${basePath}/profile/edit/#interests-heading`}><span><strong>Find your people</strong><small>Pick the activities and topics you enjoy.</small></span><ArrowRight size={16} aria-hidden="true" /></a>}</div>
            </section>
            <section className={styles.card} aria-labelledby="about-heading">
              <div className={styles.cardHeading}><span><Mail size={17} aria-hidden="true" /></span><div><p>INTRODUCTION</p><h2 id="about-heading">About you</h2></div></div>
              {profile.about ? <p className={styles.about}>{profile.about}</p> : <a className={styles.storyAction} href={`${basePath}/profile/edit/#about`}><span className={styles.storyMark}>“</span><span><strong>Give your profile a voice</strong><small>Write a short introduction about what you’re learning, building or hoping to meet.</small></span><ArrowRight size={16} aria-hidden="true" /></a>}
            </section>
          </div>
        </>}
        </article>
        <footer className={styles.footer}><span>© 2026 Collexus</span><a href={`${basePath}/profile/edit/`}>Update your details</a></footer>
      </div>
    </main>
  );
}
