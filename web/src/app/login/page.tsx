"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { CircleLoader, Logo, arcPath } from "@/components/brand/logo";
import { useHydrated } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useStore } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase/client";
import { sendMagicLink, signInWithGoogle } from "@/lib/supabase/auth";
import { errorText } from "@/lib/supabase/data";

/** Only allow same-site paths as a post-login destination. */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return "/dashboard";
  return raw;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  return (
    <React.Suspense fallback={<FullScreenLoader />}>
      <Login />
    </React.Suspense>
  );
}

function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center">
      <CircleLoader size={36} label={label} />
    </div>
  );
}

function Login() {
  const hydrated = useHydrated();
  const userId = useStore((s) => s.currentUserId);
  const onboarded = useStore((s) => s.onboarded);
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  // Signing in only flips the store; this one effect decides where to go,
  // for both a fresh sign-in and an already-signed-in visit.
  React.useEffect(() => {
    if (!hydrated || !userId) return;
    if (onboarded) router.replace(next);
    else router.replace(next === "/dashboard" ? "/onboarding" : `/onboarding?next=${encodeURIComponent(next)}`);
  }, [hydrated, userId, onboarded, next, router]);

  if (!hydrated || userId) return <FullScreenLoader label={userId ? "Signing you in" : "Loading"} />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />
      <main className="flex min-w-0 flex-col px-4 pb-6 pt-5 sm:px-8 lg:px-16 lg:pt-8">
        <div className="lg:hidden">
          <Logo size={24} />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <SignInForm />
        </div>
        <p className="text-center text-xs leading-5 text-subtle-foreground">
          {supabaseEnabled ? "Sign in securely with your StudyCircle account." : "This is a demo. No real emails are sent and nothing leaves your browser."}
        </p>
      </main>
    </div>
  );
}

/* ---------- Left: the brand ---------- */

const SEGMENTS = [-54, 18, 90, 162, 234];

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-brand-blue p-12 text-brand-cream lg:flex xl:p-16">
      {/* The mark at room scale: one lit seat, the rest barely there. Same geometry, never rotated. */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute -bottom-[120px] -right-[40px] size-[460px]"
      >
        {SEGMENTS.map((c, i) => (
          <path
            key={c}
            d={arcPath(24, 24, 18.5, c - 19, c + 19)}
            strokeWidth={6.5}
            strokeLinecap="round"
            className={i === 0 ? "stroke-brand-gold" : "stroke-brand-cream/[0.08]"}
          />
        ))}
      </svg>

      <Logo tone="dark" size={28} className="relative" />
      <div className="relative mb-auto mt-[14vh] max-w-md">
        <p className="text-display text-brand-cream">
          Study together.
          <br />
          Keep going.
        </p>
        <p className="mt-5 max-w-sm text-lg leading-7 text-brand-cream/75">
          Small groups of three to six classmates, a time that suits everyone, and sessions that run themselves.
        </p>
      </div>
      <p className="relative text-sm text-brand-cream/70">
        Built on retrieval practice, spaced sessions and learning by teaching.
      </p>
    </aside>
  );
}

/* ---------- Right: the form ---------- */

function GoogleG() {
  // Google's own mark keeps its brand colours.
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="!size-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function SignInForm() {
  const [stage, setStage] = React.useState<"start" | "sent">("start");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [googlePending, setGooglePending] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const firstRender = React.useRef(true);

  // Move focus to the new heading when the stage changes, so screen readers follow along.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (stage === "sent") headingRef.current?.focus();
    else emailRef.current?.focus();
  }, [stage]);

  const signIn = (address?: string) => useStore.getState().signIn(address);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return setError("Enter your email address to get a sign-in link.");
    if (!EMAIL.test(value)) return setError("That email looks incomplete. Check for the @ and the part after it.");
    setError(null);
    if (supabaseEnabled) {
      try {
        await sendMagicLink(value);
      } catch (cause) {
        setError(errorText(cause));
        return;
      }
    }
    setStage("sent");
  };

  const google = async () => {
    setGooglePending(true);
    if (supabaseEnabled) {
      try {
        await signInWithGoogle();
      } catch (cause) {
        toast.error(errorText(cause));
        setGooglePending(false);
      }
    } else window.setTimeout(() => signIn(), 450);
  };

  if (stage === "sent") {
    return (
      <div>
        <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-teal-soft text-teal-text">
          <MailCheck className="size-7" strokeWidth={2} />
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
          Check your inbox
        </h1>
        <p className="mt-3 text-body text-muted-foreground">
          We sent a sign-in link to{" "}
          <span className="font-semibold text-foreground [overflow-wrap:anywhere]">{email.trim()}</span>. Open it on
          this device and you&rsquo;re in.
        </p>

        {!supabaseEnabled && <div className="mt-8 rounded-2xl border border-dashed border-border-strong p-4">
          <p className="text-sm text-muted-foreground">In this demo there&rsquo;s no real email. Use the shortcut to open the link.</p>
          <Button size="lg" className="mt-3 w-full" onClick={() => signIn(email.trim())}>Open the demo link</Button>
        </div>}

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Button variant="link" className="h-11 px-0 font-semibold" onClick={() => setStage("start")}>
            Use a different email
          </Button>
          <Button
            variant="link"
            className="h-11 px-0 font-semibold text-muted-foreground"
            onClick={async () => {
              if (supabaseEnabled) {
                try { await sendMagicLink(email.trim()); toast.success("Sent again", { description: `Look for an email from StudyCircle at ${email.trim()}.` }); }
                catch (cause) { toast.error(errorText(cause)); }
              } else toast.success("Sent again", { description: `Look for an email from StudyCircle at ${email.trim()}.` });
            }}
          >
            Resend link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
        Sign in to StudyCircle
      </h1>
      <p className="mt-2 text-body text-muted-foreground">New here? The same steps create your account.</p>

      <Button
        variant="outline"
        size="lg"
        className="mt-8 w-full"
        onClick={google}
        disabled={googlePending}
        aria-busy={googlePending}
      >
        {googlePending ? <CircleLoader size={20} label="Connecting to Google" /> : <GoogleG />}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-sm font-medium text-subtle-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden />
        or
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <form noValidate onSubmit={sendLink} className="space-y-4">
        <Field label="Email" htmlFor="login-email" error={error ?? undefined} hint="Your school email works best.">
          <Input
            ref={emailRef}
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={!!error}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Email me a sign-in link
        </Button>
      </form>
    </div>
  );
}
