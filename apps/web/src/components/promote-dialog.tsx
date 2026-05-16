"use client";

import { useState, useTransition } from "react";
import { ArrowUpCircle } from "lucide-react";
import { promoteVersionAction } from "@/app/(app)/environment-actions";
import { Spinner } from "@/components/spinner";

type VersionOption = {
  id: string;
  commitMessage: string;
  createdAt: string;
  branchName: string;
};

export function PromoteDialog({
  projectSlug,
  environmentName,
  promptId,
  promptName,
  versions,
  activeVersionId,
  triggerLabel,
  requiresApproval,
  previousEnvName,
  previousEnvActiveVersionId,
}: {
  projectSlug: string;
  environmentName: string;
  promptId: string;
  promptName: string;
  versions: VersionOption[];
  activeVersionId: string | null;
  triggerLabel: string;
  requiresApproval: boolean;
  previousEnvName: string | null;
  previousEnvActiveVersionId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(
    activeVersionId ?? previousEnvActiveVersionId ?? versions[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // If the env has an upstream env in the chain, only versions live in that
  // upstream env are eligible to be promoted from this dialog.
  const orderingActive = Boolean(previousEnvName);
  const eligibleVersionId = previousEnvActiveVersionId;
  const orderingBlocked =
    orderingActive && selected !== "" && selected !== eligibleVersionId;

  function submit() {
    if (!selected) return;
    setError(null);
    start(async () => {
      try {
        await promoteVersionAction({
          projectSlug,
          environmentName,
          promptId,
          versionId: selected,
        });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={versions.length === 0}
        className="text-xs font-medium inline-flex items-center gap-1 text-neutral-700 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ArrowUpCircle size={12} />
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">
              Promote to <span className="font-mono">{environmentName}</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Choose a version of <span className="font-medium">{promptName}</span> to deploy.
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              {orderingActive && (
                <span className="font-mono uppercase px-1.5 py-0.5 border border-black/20 bg-white">
                  must be live in {previousEnvName} first
                </span>
              )}
              {requiresApproval && (
                <span className="font-mono uppercase px-1.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-900">
                  approval required
                </span>
              )}
            </div>

            <div className="mt-4 max-h-[320px] overflow-y-auto border border-black/10">
              {versions.map((v, i) => {
                const isActive = v.id === activeVersionId;
                const isSelected = v.id === selected;
                const eligible = !orderingActive || v.id === eligibleVersionId;
                return (
                  <label
                    key={v.id}
                    className={`flex items-start gap-3 px-4 py-3 ${eligible ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${i > 0 ? "border-t border-black/10" : ""} ${isSelected ? "bg-neutral-50" : eligible ? "hover:bg-neutral-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="version"
                      value={v.id}
                      checked={isSelected}
                      disabled={!eligible}
                      onChange={() => setSelected(v.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {v.commitMessage}
                        {isActive && (
                          <span className="ml-2 text-[10px] font-mono uppercase bg-black text-white px-1.5 py-0.5">
                            current
                          </span>
                        )}
                        {orderingActive && v.id === eligibleVersionId && (
                          <span className="ml-2 text-[10px] font-mono uppercase bg-emerald-600 text-white px-1.5 py-0.5">
                            live in {previousEnvName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                        {v.branchName} · {v.id.slice(-7)} ·{" "}
                        {new Date(v.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {orderingActive && !eligibleVersionId && (
              <p className="text-xs text-neutral-500 mt-3">
                Nothing is live in <span className="font-mono">{previousEnvName}</span> yet —
                promote a version there first.
              </p>
            )}

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={
                  pending ||
                  !selected ||
                  selected === activeVersionId ||
                  orderingBlocked
                }
                className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {pending && <Spinner size={14} />}
                {pending
                  ? "Promoting"
                  : requiresApproval
                    ? "Request promotion"
                    : "Promote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
