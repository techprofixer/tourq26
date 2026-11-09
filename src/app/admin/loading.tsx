import { Spinner } from "@/components/Spinner";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      <Spinner className="h-6 w-6" />
    </div>
  );
}
