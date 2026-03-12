import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/shared/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SELF OS — Sistema Operativo Identitario",
  description: "Mappa chi stai essendo nel tempo. Identifica pattern, credenze e la tua identità profonda.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
