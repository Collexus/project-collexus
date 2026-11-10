"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ArrowLeft, ArrowRight, BadgeCheck, CreditCard, LockKeyhole, TicketCheck } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { getUserProfile } from "@/lib/user-profile";
import { storeConfirmation } from "@/lib/confirmation";

type EventSummary = {
  slug: string;
  title: string;
  dateLabel: string;
  category?: string;
  dateStart?: string | null;
  dateEnd?: string | null;
  registrationClosed?: boolean;
  audience: string;
  fee: string;
};

type Registration = { slug: string; name: string; email: string; collegeId: string; phone: string; passType: string; friendCount: number; friendNames: string; image?: string; guests?: { name: string; image?: string }[] };
type RegistrationDetails = { name: string; email: string; collegeId: string; phone: string };
type ProfilePrefill = RegistrationDetails & { avatarUrl: string };

const registrationKey = (slug: string) => `collexus-demo-registration:${slug}`;
const profileDraftKey = "collexus:account-profile-draft";

async function compressPhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.76);
}

function DemoFrame({ event, step, children }: { event: EventSummary; step: string; children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="details-page demo-page">
      <div className="details-topline">
        <Link href={`/events/${event.slug}`} className="back-link site-back-link"><ArrowLeft size={15} aria-hidden="true" /> Event details</Link>
        <span className="record-label"><span className="demo-status-dot" /> NO-CHARGE DEMO</span>
      </div>
      <section className="demo-card">
        <div className="demo-progress" aria-label={`Step ${step} of 2`}>
          <span className={step === "1" ? "active" : "complete"}>1 <small>Registration</small></span>
          <i />
          <span className={step === "2" ? "active" : "complete"}>2 <small>Payment preview</small></span>
        </div>
        {children}
      </section>
      <p className="demo-privacy-note"><LockKeyhole size={14} aria-hidden="true" /> Demo only. Details stay in this browser session; nothing is sent to RCEE or a payment provider.</p>
    </main>
  );
}

export function RegistrationDemoForm({ event }: { event: EventSummary }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const isFest = event.category === "Cultural" || event.category === "Special event";
  const [details, setDetails] = useState<RegistrationDetails>({ name: "", email: "", collegeId: "", phone: "" });
  const [profile, setProfile] = useState<ProfilePrefill | null>(null);
  const [profileStatus, setProfileStatus] = useState("Loading your Collexus profile…");
  const [profileLoading, setProfileLoading] = useState(true);
  const detailsTouched = useRef(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [friendCount, setFriendCount] = useState(0);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    if (!supabase) {
      const timer = window.setTimeout(() => {
        try {
          const rawDraft = window.localStorage.getItem(profileDraftKey);
          const draft = rawDraft ? JSON.parse(rawDraft) as Record<string, unknown> : {};
          const savedProfile: ProfilePrefill = {
            name: typeof draft.full_name === "string" ? draft.full_name : "",
            email: typeof draft.email === "string" ? draft.email : "",
            collegeId: typeof draft.campus_id === "string" ? draft.campus_id : typeof draft.profile_organization_id === "string" ? draft.profile_organization_id : "",
            phone: typeof draft.profile_phone === "string" ? draft.profile_phone : "",
            avatarUrl: typeof draft.profile_avatar_url === "string" ? draft.profile_avatar_url : "",
          };
          if (active && Object.values(savedProfile).some(Boolean)) {
            setProfile(savedProfile);
            if (!detailsTouched.current) setDetails({ name: savedProfile.name, email: savedProfile.email, collegeId: savedProfile.collegeId, phone: savedProfile.phone });
            setProfileStatus("Details loaded from the profile saved on this device.");
          } else if (active) setProfileStatus("Sign in to fetch saved details from your Collexus profile.");
        } catch {
          if (active) setProfileStatus("Sign in to fetch saved details from your Collexus profile.");
        }
        if (active) setProfileLoading(false);
      }, 0);
      return () => { active = false; window.clearTimeout(timer); };
    }

    void (async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError || !data.user) {
          setProfileStatus("Sign in to fetch saved details from your Collexus profile.");
          setProfileLoading(false);
          return;
        }
        const { profile: saved, error: profileError } = await getUserProfile(supabase, data.user.id);
        const metadata = data.user.user_metadata ?? {};
        const savedProfile: ProfilePrefill = {
          name: saved?.full_name ?? String(metadata.full_name ?? metadata.name ?? ""),
          email: data.user.email ?? "",
          collegeId: saved?.campus_id ?? String(metadata.campus_id ?? ""),
          phone: data.user.phone_confirmed_at && data.user.phone ? data.user.phone : saved?.profile_phone ?? String(metadata.phone_number ?? data.user.phone ?? ""),
          avatarUrl: saved?.profile_avatar_url ?? String(metadata.avatar_url ?? ""),
        };
        if (savedProfile.avatarUrl && !savedProfile.avatarUrl.startsWith("http") && !savedProfile.avatarUrl.startsWith("data:")) {
          const { data: signedPhoto } = await supabase.storage.from("profile-photos").createSignedUrl(savedProfile.avatarUrl, 3600);
          if (signedPhoto?.signedUrl) savedProfile.avatarUrl = signedPhoto.signedUrl;
        }
        if (!active) return;
        setProfile(savedProfile);
        if (!detailsTouched.current) setDetails({ name: savedProfile.name, email: savedProfile.email, collegeId: savedProfile.collegeId, phone: savedProfile.phone });
        setProfileStatus(profileError ? "Some saved profile fields could not be loaded. You can fill them in below." : "Details loaded from your Collexus profile. You can edit them before continuing.");
        setProfileLoading(false);
      } catch {
        if (active) {
          setProfileStatus("We couldn’t load your profile. You can enter your details below.");
          setProfileLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  function updateDetail(field: keyof RegistrationDetails, value: string) {
    detailsTouched.current = true;
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function previewPhoto(change: ChangeEvent<HTMLInputElement>) {
    const file = change.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      change.currentTarget.value = "";
      setError("Choose a profile image smaller than 5 MB.");
      return;
    }
    setError("");
    setPhotoUrl(URL.createObjectURL(file));
  }

  async function submit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    const values = new FormData(eventForm.currentTarget);
    const registration: Registration = {
      slug: event.slug,
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
      collegeId: String(values.get("collegeId") ?? "").trim(),
      phone: String(values.get("phone") ?? "").trim(),
      passType: String(values.get("passType") ?? "student"),
      friendCount: isFest ? Number(values.get("friendCount") ?? 0) : 0,
      friendNames: isFest ? String(values.get("friendNames") ?? "").trim() : "",
    };
    if (!registration.name || !registration.email || !registration.collegeId || !registration.phone || (isFest && registration.friendCount > 0 && !registration.friendNames)) {
      setError("Complete the required details to continue.");
      return;
    }
    const photo = values.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try { registration.image = await compressPhoto(photo); }
      catch { registration.image = profile?.avatarUrl; }
    } else if (photoUrl) registration.image = profile?.avatarUrl;
    else registration.image = profile?.avatarUrl;
    if (isFest) {
      const friendNames = registration.friendNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
      if (friendNames.length !== registration.friendCount) {
        setError("Add exactly one name for each extra fest pass.");
        return;
      }
      registration.guests = await Promise.all(friendNames.slice(0, registration.friendCount).map(async (name, index) => {
        const guestPhoto = values.get(`friendPhoto-${index + 1}`);
        let image: string | undefined;
        if (guestPhoto instanceof File && guestPhoto.size > 0) {
          try { image = await compressPhoto(guestPhoto); } catch { image = undefined; }
        }
        return { name, image };
      }));
    }
    try {
      sessionStorage.setItem(registrationKey(event.slug), JSON.stringify(registration));
    } catch {
      setError("This browser session cannot save demo details. Allow session storage and try again.");
      return;
    }
    router.push(`/demo-payment/${event.slug}`);
  }

  return (
    <DemoFrame event={event} step="1">
      <span className="demo-kicker"><TicketCheck size={15} aria-hidden="true" /> EVENT REGISTRATION</span>
      <h1>{event.registrationClosed ? "Registration preview" : "Register for this event"}</h1>
      <p className="demo-event-title">{event.title}</p>
      <div className="demo-event-meta"><span>{event.dateLabel}</span><span>{event.audience}</span></div>
      <p className="demo-archive-notice">{event.registrationClosed ? "Registration for this historical event is closed. You can preview the form and fee layout, but this will not create an entry, reserve a place, or take payment." : "Preview only. This form does not send an entry to the organizer or reserve a place."}</p>
      <form className="demo-form" onSubmit={submit}>
        <div className="demo-profile-row"><div className="demo-avatar">{photoUrl || profile?.avatarUrl ? <Image src={photoUrl || profile?.avatarUrl || ""} alt="Profile photo preview" width={50} height={50} unoptimized /> : <span aria-hidden="true">{details.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "YOU"}</span>}</div><div className="demo-profile-copy"><strong>Profile photo</strong><small>{profile?.avatarUrl && !photoUrl ? "Using your saved profile photo" : "Optional · JPG, PNG or WebP · up to 5 MB"}</small></div><label className="demo-photo-button" htmlFor="demo-photo">Add image</label><input className="demo-photo-input" id="demo-photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={previewPhoto} /></div>
        <p className="demo-profile-status" role="status" aria-live="polite">{profileLoading ? "Loading your Collexus profile…" : <>{profileStatus}{!profile && <Link href={`/login/?next=${encodeURIComponent(`/events/${event.slug}/register/`)}`}> Sign in</Link>}{profile && !details.collegeId.trim() && <Link href="/profile/edit/"> Add your College ID in profile</Link>}</>}</p>
        <div className="demo-registration-grid">
          <label htmlFor="demo-name">Full name</label><input id="demo-name" name="name" autoComplete="name" required maxLength={90} placeholder="Your name" value={details.name} onChange={(change) => updateDetail("name", change.target.value)} />
          <label htmlFor="demo-email">Email address</label><input id="demo-email" name="email" type="email" autoComplete="email" required maxLength={160} placeholder="you@example.com" value={details.email} onChange={(change) => updateDetail("email", change.target.value)} />
          <label htmlFor="demo-college-id">College ID</label><input id="demo-college-id" name="collegeId" required maxLength={40} placeholder="Your student ID" value={details.collegeId} onChange={(change) => updateDetail("collegeId", change.target.value)} />
          <label htmlFor="demo-phone">Phone number</label><input id="demo-phone" name="phone" type="tel" autoComplete="tel" required maxLength={20} placeholder="Your mobile number" value={details.phone} onChange={(change) => updateDetail("phone", change.target.value)} />
          {isFest ? <><label htmlFor="demo-pass-type">Pass type</label><select id="demo-pass-type" name="passType"><option value="student">Student pass</option><option value="outer">Guest pass</option></select><label htmlFor="demo-friend-count">Extra fest passes</label><select id="demo-friend-count" name="friendCount" onChange={(change) => setFriendCount(Number(change.target.value))}><option value="0">Just me</option><option value="1">1 friend</option><option value="2">2 friends</option><option value="3">3 friends</option><option value="4">4 friends</option><option value="5">5 friends</option></select><label className="demo-friends-label" htmlFor="demo-friend-names">Friends’ names <small>(if adding passes)</small></label><textarea className="demo-friends-field" id="demo-friend-names" name="friendNames" rows={2} maxLength={500} placeholder="Add one name per line" />{friendCount > 0 && <><div className="demo-friends-label">Personalize each extra pass <small>(optional photo for each person)</small></div>{Array.from({ length: friendCount }, (_, index) => <label className="demo-guest-photo" htmlFor={`demo-friend-photo-${index + 1}`} key={index}>Guest {index + 1} photo<input id={`demo-friend-photo-${index + 1}`} name={`friendPhoto-${index + 1}`} type="file" accept="image/png,image/jpeg,image/webp" /></label>)}</>}</> : null}
        </div>
        <p className="demo-pass-rule">{isFest ? "Fests and cultural events may allow passes for friends and outside guests, subject to the event’s rules and organizer approval." : "Technical and academic events issue a pass for the registered participant only."}</p>
        <section className="demo-fee-card" aria-labelledby="demo-fee-heading"><div className="demo-fee-heading"><div><span className="demo-kicker">PAYMENT DETAILS</span><h2 id="demo-fee-heading">Fee breakdown</h2></div><span className={event.registrationClosed ? "demo-fee-status closed" : "demo-fee-status"}>{event.registrationClosed ? "Registration closed" : "Fee not confirmed"}</span></div><p className="demo-published-fee">{event.fee}</p><dl><div><dt>Event registration fee</dt><dd>—</dd></div><div><dt>Platform fee <span>(0.5%)</span></dt><dd>—</dd></div><div><dt>Payment gateway and GST <span>(2% fee + 18% GST)</span></dt><dd>—</dd></div><div className="demo-fee-total"><dt>Total payable</dt><dd>—</dd></div></dl><p className="demo-fee-disclaimer">A confirmed single fee is not available in the official listing, so the charges cannot be calculated. No payment is taken in this preview.</p></section>
        <p className="demo-registration-note">Pass eligibility depends on the event’s rules. Technical and academic events are for the registered participant; fest and cultural guest passes may be available when allowed by the organizer. Your registration details stay in this browser session, and any added photo is previewed locally rather than uploaded.</p>
        {error && <p className="demo-form-error" role="alert">{error}</p>}
        <button className="primary-button demo-submit" type="submit">Continue to registration preview <ArrowRight size={16} aria-hidden="true" /></button>
      </form>
    </DemoFrame>
  );
}

export function DemoPaymentPanel({ event }: { event: EventSummary }) {
  const router = useRouter();
  const isFest = event.category === "Cultural" || event.category === "Special event";
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let nextRegistration: Registration | null = null;
      try {
        const raw = sessionStorage.getItem(registrationKey(event.slug));
        const parsed = raw ? JSON.parse(raw) as Registration : null;
        if (parsed?.slug === event.slug && parsed.name && parsed.email) nextRegistration = parsed;
      } catch { nextRegistration = null; }
      setRegistration(nextRegistration);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [event.slug]);

  function simulatePayment() {
    if (!registration) return;
    try {
      sessionStorage.setItem(`${registrationKey(event.slug)}:complete`, "true");
      const reference = `CX-${nanoid(12).toUpperCase()}`;
      storeConfirmation({
        kind: isFest ? "fest" : "event",
        status: "preview",
        reference,
        createdAt: new Date().toISOString(),
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        collegeId: registration.collegeId,
        image: registration.image,
        title: event.title,
        subtitle: registration.passType === "outer" ? "Guest fest pass preview" : "Participant pass preview",
        date: event.dateLabel,
        people: registration.friendNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean),
        participants: [
          { name: registration.name, image: registration.image, reference },
          ...(registration.guests ?? []).map((guest) => ({ name: guest.name, image: guest.image, reference: `CX-${nanoid(12).toUpperCase()}` })),
        ],
      });
    } catch {
      // The confirmation route will explain if this browser cannot keep the preview details.
    }
    router.push("/confirmation/");
  }

  return (
    <DemoFrame event={event} step="2">
      <span className="demo-kicker"><CreditCard size={15} aria-hidden="true" /> PAYMENT PREVIEW</span>
      <h1>Secure checkout</h1>
      <p className="demo-event-title">{event.title}</p>
      {!ready ? <p className="demo-loading" role="status">Preparing your demo checkout…</p> : registration ? (
        <>
          <div className="demo-order-summary">
            <div><span>Registrant</span><strong>{registration.name}</strong></div>
            <div><span>Email</span><strong>{registration.email}</strong></div>
            <div><span>Published entry fee</span><strong>{event.fee}</strong></div>
          </div>
          <div className="demo-gateway-mark"><span className="gateway-symbol"><CreditCard size={20} aria-hidden="true" /></span><span><strong>Razorpay checkout preview</strong><small>Sandbox-style screen · no transaction</small></span><BadgeCheck size={19} aria-hidden="true" /></div>
          <p className="demo-archive-notice">This historical event is closed. The button below only demonstrates the checkout handoff. It will not contact Razorpay, collect payment, or create a registration.</p>
          <button className="primary-button demo-submit" type="button" onClick={simulatePayment}>Simulate successful payment <ArrowRight size={16} aria-hidden="true" /></button>
        </>
      ) : (
        <div className="demo-no-session"><p>No registration details were found in this browser session.</p><Link className="primary-button" href={`/events/${event.slug}/register`}>Start registration preview <ArrowRight size={16} aria-hidden="true" /></Link></div>
      )}
      <Link className="demo-back-link site-back-link" href={`/events/${event.slug}/register`}><ArrowLeft size={14} aria-hidden="true" /> Back to registration</Link>
    </DemoFrame>
  );
}

export function DemoPaymentSuccess({ event }: { event: EventSummary }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let nextRegistration: Registration | null = null;
      try {
        const raw = sessionStorage.getItem(registrationKey(event.slug));
        const parsed = raw ? JSON.parse(raw) as Registration : null;
        const complete = sessionStorage.getItem(`${registrationKey(event.slug)}:complete`) === "true";
        if (complete && parsed?.slug === event.slug) nextRegistration = parsed;
      } catch { nextRegistration = null; }
      setRegistration(nextRegistration);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [event.slug]);

  return (
    <main id="main-content" tabIndex={-1} className="details-page demo-page">
      <section className="demo-card demo-success-card">
        {!ready ? <p className="demo-loading" role="status">Checking demo result…</p> : registration ? (
          <>
            <span className="demo-success-icon"><BadgeCheck size={28} aria-hidden="true" /></span>
            <span className="demo-kicker">DEMO CHECKOUT COMPLETE</span>
            <h1>Payment preview finished</h1>
            <p className="demo-success-copy">Thanks, {registration.name}. This was a no-charge simulation for <strong>{event.title}</strong>. You are not registered and no payment was made.</p>
            <div className="demo-reference"><span>Demo reference</span><strong>DEMO-{event.slug.slice(0, 6).toUpperCase()}-01</strong></div>
          </>
        ) : (
          <>
            <span className="demo-kicker">NO DEMO PAYMENT FOUND</span>
            <h1>Checkout was not completed</h1>
            <p className="demo-success-copy">Start from the registration preview to see the full demo flow.</p>
          </>
        )}
        <div className="demo-success-actions"><Link className="primary-button" href={`/events/${event.slug}`}>Back to event <ArrowRight size={16} aria-hidden="true" /></Link><Link className="secondary-button" href="/#featured-events">Browse events</Link></div>
      </section>
    </main>
  );
}
