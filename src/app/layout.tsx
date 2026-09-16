import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Home, Library, ListVideo } from "lucide-react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { TopProgress } from "@/components/top-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalTube",
  description: "A calmer place to watch.",
};

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: Library },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
];

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
        <body className="min-h-screen font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Both read useSearchParams → wrap in Suspense. */}
            <Suspense>
              <TopProgress />
            </Suspense>
            <Suspense>
              <SiteHeader />
            </Suspense>

            <div className="flex">
              <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 border-r border-border p-3 lg:block">
                <nav className="space-y-1">
                  {NAV.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Icon className="size-5" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </aside>

              <main className="min-w-0 flex-1 px-4 py-4 sm:px-6">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
