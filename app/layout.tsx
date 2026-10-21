import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteUtilities } from "@/components/site-utilities";

const poppins = localFont({
  src: [
    { path: "../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Collexus | Campus Events",
    template: "%s | Collexus",
  },
  description:
    "Find campus events, hackathons, workshops, competitions and cultural experiences with Collexus.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{
        "--home-event-background": `url("${publicBasePath}/assets/unique_sources/home_hack.jpg")`,
        "--reference-background-image": `url("${publicBasePath}/assets/collexus-theme-reference.png")`,
        "--event-feed-background-image": `url("${publicBasePath}/assets/event-feed-nightfall.png")`,
      } as React.CSSProperties}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { const theme = localStorage.getItem("collexus_theme"); document.documentElement.dataset.collexusTheme = theme === "light" || theme === "day" ? "light" : "dark"; } catch { document.documentElement.dataset.collexusTheme = "dark"; }` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${poppins.variable} bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-primary warm-editorial-theme vivid-nightfall-theme`}>
        <SiteUtilities />
        {children}
      </body>
    </html>
  );
}
