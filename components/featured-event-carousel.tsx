"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FocusEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { CampusEvent } from "@/data/events";
import styles from "./featured-event-carousel.module.css";

type FeaturedEvent = Pick<
  CampusEvent,
  "slug" | "title" | "category" | "dateLabel" | "venue" | "organizer" | "description" | "format" | "image"
>;

type FeaturedEventCarouselProps = {
  events: FeaturedEvent[];
  basePath: string;
};

export function FeaturedEventCarousel({ events, basePath }: FeaturedEventCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      if (motionQuery.matches) setIsPlaying(false);
    };
    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);
    return () => motionQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (events.length < 2 || !isPlaying || isInteracting) return;
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % events.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [events.length, isInteracting, isPlaying]);

  if (events.length === 0) return null;

  const activeEvent = events[activeIndex % events.length];
  const goTo = (index: number) => setActiveIndex((index + events.length) % events.length);
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsInteracting(false);
  };

  return (
    <section
      className={styles.panel}
      aria-label="Featured campus events"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={handleBlur}
    >
      <div className={styles.header}>
        <span className={styles.eyebrow}><span aria-hidden="true" /> Collexus event spotlight</span>
        <span className={styles.counter}>{String(activeIndex + 1).padStart(2, "0")} <i /> {String(events.length).padStart(2, "0")}</span>
      </div>

      <div className={styles.artwork} aria-live={isInteracting ? "polite" : "off"}>
        <Image
          key={activeEvent.slug}
          className={styles.image}
          src={activeEvent.image}
          alt={activeEvent.title + " event artwork"}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority={activeIndex === 0}
        />
        <div className={styles.imageWash} />
        <div className={styles.imageTop}>
          <span className={styles.category}>{activeEvent.category}</span>
          <span className={styles.source}><span aria-hidden="true" /> RCEE · VERIFIED SOURCE</span>
        </div>
        <div className={styles.imageCopy}>
          <p className={styles.imageKicker}>On campus · {activeEvent.format}</p>
          <h2 key={activeEvent.slug + "-title"}>{activeEvent.title}</h2>
          <p>{activeEvent.description}</p>
        </div>
        <div className={styles.progress} aria-hidden="true"><span key={activeEvent.slug + "-progress"} /></div>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>When</span>
          <strong>{activeEvent.dateLabel}</strong>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Hosted by</span>
          <strong>{activeEvent.organizer}</strong>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.navigation} aria-label="Choose featured event">
          {events.map((event, index) => (
            <button
              className={styles.dotButton}
              type="button"
              key={event.slug}
              aria-label={"Show " + event.title}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => goTo(index)}
            >
              <span className={activeIndex === index ? styles.activeDot : styles.dot} />
            </button>
          ))}
        </div>
        <div className={styles.controlActions}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Show previous event"
            onClick={() => goTo(activeIndex - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={isPlaying ? "Pause automatic event rotation" : "Play automatic event rotation"}
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Show next event"
            onClick={() => goTo(activeIndex + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
          <Link className={styles.viewLink} href={basePath + "/events/" + activeEvent.slug + "/"}>
            View event <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
