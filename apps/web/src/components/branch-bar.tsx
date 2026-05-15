"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, GitMerge, Plus, ChevronDown, Trash2 } from "lucide-react";
import {
  createBranchAction,
  deleteBranchAction,
  mergeBranchAction,
} from "@/app/(app)/actions";
import { DiffView } from "@/components/diff-view";
import { Spinner } from "@/components/spinner";

type BranchLite = { id: string; name: string; headId: string | null; headContent: string };

const MAIN = "main";

export function BranchBar({
  projectSlug,
  promptSlug,
  currentBranch,
  branches,
  currentVersionId,
}: {
  projectSlug: string;
  promptSlug: string;
  currentBranch: string;
  branches: BranchLite[];
  currentVersionId: string | null;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [merging, setMerging] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const current = branches.find((b) => b.name === currentBranch) ?? branches[0];
  const mainBranch = branches.find((b) => b.name === MAIN);
  const isMain = current.name === MAIN;
  const canMerge = !isMain && Boolean(mainBranch);

  return (
    <div className="mb-4 flex items-center justify-between border border-neutral-200 bg-white px-3 py-2">
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 text-sm px-2 py-1 hover:bg-neutral-100"
        >
          <GitBranch size={14} />
          <span className="font-mono">{current.name}</span>
          <ChevronDown size={14} className="text-neutral-400" />
        </button>

        {menuOpen && (
          <div
            className="absolute top-full left-0 mt-1 w-64 bg-white border border-neutral-200 shadow-lg z-20"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div className="py-1 max-h-64 overflow-auto">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(
                      `/projects/${projectSlug}/${promptSlug}${b.name === MAIN ? "" : `?branch=${encodeURIComponent(b.name)}`}`
                    );
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm font-mono hover:bg-neutral-100 flex items-center justify-between ${
                    b.name === current.name ? "bg-neutral-50" : ""
                  }`}
                >
                  <span>{b.name}</span>
                  {b.name === current.name && (
                    <span className="text-xs text-neutral-400">current</span>
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-neutral-200 py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setCreating(true);
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 flex items-center gap-2"
              >
                <Plus size={14} /> New branch
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canMerge && (
          <button
            onClick={() => setMerging(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100"
          >
            <GitMerge size={13} /> Merge into <span className="font-mono">main</span>
          </button>
        )}
        {!isMain && (
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 text-red-700"
          >
            <Trash2 size={13} /> Delete branch
          </button>
        )}
      </div>

      {creating && (
        <CreateBranchModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          fromVersionId={current.headId ?? currentVersionId}
          baseLabel={current.name}
          onClose={() => setCreating(false)}
        />
      )}

      {merging && mainBranch && (
        <MergeModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          source={current}
          target={mainBranch}
          onClose={() => setMerging(false)}
        />
      )}

      {deleteOpen && (
        <DeleteBranchModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          branchId={current.id}
          branchName={current.name}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}

function CreateBranchModal({
  projectSlug,
  promptSlug,
  fromVersionId,
  baseLabel,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  fromVersionId: string | null;
  baseLabel: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    if (!fromVersionId) {
      setError("Base branch has no commits yet.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await createBranchAction({ projectSlug, promptSlug, name, fromVersionId });
        onClose();
        router.push(`/projects/${projectSlug}/${promptSlug}?branch=${encodeURIComponent(name)}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose}>
      <h2 className="text-lg font-semibold mb-1">New branch</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Forking from <span className="font-mono">{baseLabel}</span>.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="experiment-tone"
        className="w-full px-3 py-2 border border-neutral-300 text-sm font-mono"
        autoFocus
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          disabled={pending}
          className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending || !name}
          className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Creating" : "Create branch"}
        </button>
      </div>
    </Modal>
  );
}

function DeleteBranchModal({
  projectSlug,
  promptSlug,
  branchId,
  branchName,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  branchId: string;
  branchName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      try {
        await deleteBranchAction({ projectSlug, promptSlug, branchId });
        onClose();
        router.push(`/projects/${projectSlug}/${promptSlug}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose}>
      <h2 className="text-lg font-semibold mb-1">Delete branch?</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Delete <span className="font-mono">{branchName}</span>. Versions on this branch stay in
        history; the branch pointer is removed.
      </p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={pending}
          className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="h-9 px-4 bg-red-700 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Deleting" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

function MergeModal({
  projectSlug,
  promptSlug,
  source,
  target,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  source: BranchLite;
  target: BranchLite;
  onClose: () => void;
}) {
  const ours = target.headContent;
  const theirs = source.headContent;
  const identical = ours === theirs;

  const [resolved, setResolved] = useState(theirs);
  const [message, setMessage] = useState(`Merge ${source.name} into ${target.name}`);
  const [deleteSource, setDeleteSource] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const stillDirty = useMemo(() => resolved === ours, [resolved, ours]);

  function submit() {
    if (identical) {
      setError("Source and target are identical — nothing to merge.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await mergeBranchAction({
          projectSlug,
          promptSlug,
          fromBranchName: source.name,
          toBranchName: target.name,
          resolvedContent: resolved,
          commitMessage: message,
          deleteSource,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose} wide>
      <h2 className="text-lg font-semibold mb-1">
        Merge <span className="font-mono">{source.name}</span> into{" "}
        <span className="font-mono">{target.name}</span>
      </h2>
      <p className="text-sm text-neutral-500 mb-4">
        {identical
          ? "Branches are identical — nothing to merge."
          : "Review the diff, then edit the resolved content below."}
      </p>

      {!identical && (
        <>
          <div className="mb-4">
            <DiffView
              from={ours}
              to={theirs}
              fromLabel={target.name}
              toLabel={source.name}
            />
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-neutral-600">Resolved content</label>
              {stillDirty && (
                <span className="text-xs text-amber-700">
                  Currently identical to <span className="font-mono">{target.name}</span> — edit to apply changes from{" "}
                  <span className="font-mono">{source.name}</span>.
                </span>
              )}
            </div>
            <textarea
              value={resolved}
              onChange={(e) => setResolved(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 text-sm font-mono min-h-[200px] leading-6"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs text-neutral-600">Commit message</label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700 mb-2">
            <input
              type="checkbox"
              checked={deleteSource}
              onChange={(e) => setDeleteSource(e.target.checked)}
            />
            Delete <span className="font-mono">{source.name}</span> after merge
          </label>
        </>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          disabled={pending}
          className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending || identical || !message.trim()}
          className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Merging" : "Merge"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-md"} p-6 max-h-[90vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
