"use client";

import { useTransition, useState } from "react";
import { Check, X } from "lucide-react";
import {
  approveDeploymentAction,
  rejectDeploymentAction,
} from "@/app/(app)/environment-actions";
import { Spinner } from "@/components/spinner";

export function DeploymentReviewButtons({
  projectSlug,
  deploymentId,
}: {
  projectSlug: string;
  deploymentId: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: typeof approveDeploymentAction) {
    setError(null);
    start(async () => {
      try {
        await fn({ projectSlug, deploymentId });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => run(approveDeploymentAction)}
        disabled={pending}
        className="h-7 px-2 bg-black text-white text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
      >
        {pending ? <Spinner size={12} /> : <Check size={12} />}
        Approve
      </button>
      <button
        onClick={() => run(rejectDeploymentAction)}
        disabled={pending}
        className="h-7 px-2 border border-black/20 bg-white text-xs font-medium inline-flex items-center gap-1 hover:bg-neutral-50 disabled:opacity-50"
      >
        <X size={12} />
        Reject
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
