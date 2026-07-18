"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">500</h1>
      <p className="text-muted-foreground">Something went wrong</p>
      <button onClick={reset} className="text-sm text-primary hover:underline">
        Try again
      </button>
    </div>
  );
}
