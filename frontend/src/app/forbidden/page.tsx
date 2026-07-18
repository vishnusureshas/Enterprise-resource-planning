import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}
