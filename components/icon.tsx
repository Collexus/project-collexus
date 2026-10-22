"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleHelp,
  ContactRound,
  CreditCard,
  Fingerprint,
  FilterX,
  GitBranch,
  Globe2,
  GraduationCap,
  Info,
  Keyboard,
  LayoutGrid,
  LogIn,
  MapPin,
  Menu,
  Moon,
  Network,
  PartyPopper,
  QrCode,
  Radio,
  RotateCcw,
  ScanQrCode,
  Search,
  Shapes,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Terminal,
  Ticket,
  TicketCheck,
  Trees,
  Trophy,
  UsersRound,
  UserRound,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  account_tree: GitBranch,
  apps: LayoutGrid,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  arrow_up: ArrowUp,
  arrow_up_right: ArrowUpRight,
  badge: ContactRound,
  bolt: Zap,
  calendar_month: CalendarDays,
  category: Shapes,
  celebration: PartyPopper,
  check_circle: CircleCheck,
  close: X,
  confirmation_number: TicketCheck,
  dark_mode: Moon,
  event_available: CalendarCheck2,
  event_upcoming: CalendarPlus,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  fingerprint: Fingerprint,
  filter_alt_off: FilterX,
  public: Globe2,
  groups: UsersRound,
  help: CircleHelp,
  hub: Network,
  info: Info,
  keyboard: Keyboard,
  local_activity: Ticket,
  location_on: MapPin,
  login: LogIn,
  light_mode: Sun,
  menu: Menu,
  park: Trees,
  payments: CreditCard,
  qr_code_2: QrCode,
  qr_code_scanner: ScanQrCode,
  restart_alt: RotateCcw,
  school: GraduationCap,
  search: Search,
  sensors: Radio,
  share: Share2,
  shield_person: ShieldCheck,
  sports_cricket: Trophy,
  terminal: Terminal,
  tune: SlidersHorizontal,
  person: UserRound,
  verified: BadgeCheck,
  wallet: WalletCards,
  work: BriefcaseBusiness,
  workspace_premium: Award,
};

export type IconName = keyof typeof iconMap;

type IconProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  name: string;
};
type LucideGlyphProps = Omit<ComponentPropsWithoutRef<"svg">, "name"> & {
  name: string;
};

export function LucideGlyph({ name, ...props }: LucideGlyphProps) {
  const Glyph = iconMap[name] ?? CircleHelp;
  return <Glyph {...props} width="1em" height="1em" strokeWidth={2} aria-hidden="true" focusable="false" />;
}

/** Inline Lucide wrapper with a font-size based box, matching the old icon slot sizing. */
export function Icon({ name, className, ...props }: IconProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [currentName, setCurrentName] = useState(name);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const syncName = () => setCurrentName(element.dataset.iconName || name);
    syncName();
    const observer = new MutationObserver(syncName);
    observer.observe(element, { attributes: true, attributeFilter: ["data-icon-name"] });
    return () => observer.disconnect();
  }, [name]);

  return (
    <span
      {...props}
      ref={ref}
      data-icon-name={name}
      className={["lucide-icon", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <LucideGlyph name={currentName} className="lucide-svg" />
    </span>
  );
}
