import { Spinner } from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
