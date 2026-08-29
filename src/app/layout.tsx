import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "MOSHA — Personal Operating System",
  description: "Ahmed's Private Digital Sanctuary & Precision Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Geist+Mono:wght@300;400;500;600&family=Geist:wght@300;400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#E2E8F0] selection:text-[#1A202C]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
