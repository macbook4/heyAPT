import "./globals.css";
import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

export const metadata: Metadata = {
  title: "heyAPT",
  description: "Curated interior POI map",
};

type RootLayoutProps = {
  children: ReactNode;
};

/**
 * Provides root HTML shell for the web app.
 */
export default function RootLayout({ children }: RootLayoutProps): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
