import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <Spinner size={48} />
    </div>
  );
}
