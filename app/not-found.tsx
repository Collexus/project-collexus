import { Icon } from "@/components/icon";
import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><span className="eyebrow"><span className="eyebrow-line" /> LOST IN THE ARCHIVE</span><h1>This event<br /><span>isn’t here.</span></h1><p>That page may have moved. Head back to the event archive and find another one.</p><Link href="/#events" className="primary-button">Browse events <Icon name="arrow_up_right" /></Link></main>;
}
