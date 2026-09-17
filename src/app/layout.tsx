import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SideNav } from "@/components/side-nav";
import { TopProgress } from "@/components/top-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalTube",
  description: "A calmer place to watch.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body className="min-h-screen overflow-x-hidden font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense>
              <TopProgress />
            </Suspense>
            <Suspense>
              <SiteHeader />
            </Suspense>

            <div className="mx-auto flex max-w-[1600px]">
              <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-border/70 p-3 lg:block">
                <SideNav />
              </aside>

              <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
