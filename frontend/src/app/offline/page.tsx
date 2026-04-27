export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M3 3l18 18M10.586 10.586A2 2 0 0013 13"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">You&apos;re offline</h1>
        <p className="max-w-sm text-muted-foreground">
          Check your internet connection and try again. ShelfSpot needs a connection to sync your inventory.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
      >
        Try again
      </button>
    </div>
  );
}
