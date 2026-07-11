import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/shared/query-provider";
import { ThemeProvider, ThemeScript } from "@/components/shared/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SELF OS — Sistema Operativo Identitario",
  description: "Mappa la tua identità in azione nel tempo. Identifica pattern, credenze e la parte più profonda di te.",
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
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
