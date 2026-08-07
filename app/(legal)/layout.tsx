import Image from "next/image";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

/*
 * Public chrome for the legal pages (/terms, /privacy, /disclaimer). Outside
 * the (app) group so it's reachable signed-out; middleware allowlists these
 * paths. The prose styling is applied via child selectors so each page can use
 * plain <h1>/<h2>/<p>/<ul> markup.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-6">
          <Link href="/" aria-label="Rehearse — home">
            <Image
              src="/rehearse_logo_dark.svg"
              alt="Rehearse"
              width={320}
              height={100}
              unoptimized
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="space-y-4 text-sm leading-relaxed text-foreground/80 [&_a]:text-primary [&_a]:underline [&_h1]:text-[clamp(1.75rem,3vw,2.25rem)] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mt-9 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-foreground [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          {children}
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/disclaimer" className="hover:text-foreground">
            Disclaimer
          </Link>
          <span className="ml-auto">
            © {new Date().getFullYear()} {LEGAL.productName}
          </span>
        </div>
      </footer>
    </div>
  );
}
