import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Announcer } from "@/components/Announcer";
import "./globals.css";

// Fonts are self-hosted (OFL licensed), so the app builds and runs without reaching Google.
const display = localFont({ src: "./fonts/fredoka-latin-600-normal.woff2", weight: "600", variable: "--font-display", fallback: ["ui-rounded", "system-ui", "sans-serif"] });
const body = localFont({
  src: [
    { path: "./fonts/atkinson-hyperlegible-next-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/atkinson-hyperlegible-next-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/atkinson-hyperlegible-next-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/atkinson-hyperlegible-next-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});
const mono = localFont({ src: "./fonts/atkinson-hyperlegible-mono-latin-500-normal.woff2", weight: "500", variable: "--font-mono", fallback: ["ui-monospace", "Menlo", "monospace"] });

export const metadata: Metadata = {
  title: { default: "Back of House", template: "%s · Back of House" },
  description: "Clock in, count stock, reorder, build the day's menu and learn the recipes.",
};

export const viewport: Viewport = { themeColor: "#fcf8fb", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Announcer>{children}</Announcer>
      </body>
    </html>
  );
}
