import { LoadingDots } from "@/components/shared/LoadingDots";

export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <LoadingDots />
    </div>
  );
}
