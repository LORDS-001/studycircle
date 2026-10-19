import Link from "next/link";
import { Mark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center">
        <Mark size={56} title={null} />
        <h1 className="mt-8 text-h1">This page isn&rsquo;t in the circle</h1>
        <p className="mt-2 max-w-sm text-body text-muted-foreground">
          The link may be old, or the page was moved. Head back and pick up where you left off.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
