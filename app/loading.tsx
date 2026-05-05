export default function Loading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
        Loading
      </div>
    </div>
  );
}
