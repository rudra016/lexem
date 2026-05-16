"use client";

import { useTransition } from "react";
import { setEnvironmentApprovalAction } from "@/app/(app)/environment-actions";

export function EnvApprovalToggle({
  projectSlug,
  environmentName,
  requiresApproval,
}: {
  projectSlug: string;
  environmentName: string;
  requiresApproval: boolean;
}) {
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      await setEnvironmentApprovalAction({
        projectSlug,
        environmentName,
        requiresApproval: !requiresApproval,
      });
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={
        requiresApproval
          ? "Promotions to this env need approval"
          : "Promotions go live immediately"
      }
      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 border transition-colors ${
        requiresApproval
          ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
          : "bg-white border-black/20 text-neutral-600 hover:bg-neutral-50"
      } disabled:opacity-50`}
    >
      {requiresApproval ? "approval on" : "approval off"}
    </button>
  );
}
