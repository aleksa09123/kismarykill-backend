import type { Metadata, Viewport } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display"
});

const googlePublisherId = process.env.NEXT_PUBLIC_GOOGLE_PUBLISHER_ID;

export const metadata: Metadata = {
  title: "Kiss Marry Kill",
  description: "Mobile-first social matching game"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        {children}
        {googlePublisherId ? (
          <Script
            id="google-adsense-loader"
            strategy="afterInteractive"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${googlePublisherId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
