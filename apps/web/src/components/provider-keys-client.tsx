"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import {
  createProviderKeyAction,
  updateProviderKeyAction,
  deleteProviderKeyAction,
} from "@/app/(app)/settings-actions";
import { Spinner } from "@/components/spinner";

type Provider = "OPENAI" | "ANTHROPIC" | "GOOGLE";

const PROVIDERS: Provider[] = ["OPENAI", "ANTHROPIC", "GOOGLE"];

const LABELS: Record<Provider, string> = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google",
};

const SUGGESTED_MODELS: Record<Provider, string[]> = {
  OPENAI: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "o4-mini"],
  ANTHROPIC: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-7",
  ],
  GOOGLE: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
};

type KeyRow = {
  id: string;
  provider: Provider;
  label: string;
  defaultModel: string | null;
  createdAt: string;
};

export function ProviderKeysClient({ keys }: { keys: KeyRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<KeyRow | null>(null);

  return (
    <div>
      {keys.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-8 text-center">
          <KeyRound size={20} className="mx-auto text-neutral-400 mb-2" />
          <div className="font-medium mb-1">No provider keys yet</div>
          <p className="text-sm text-neutral-500 mb-4">
            Add a key from OpenAI, Anthropic, or Google to run evals.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="h-10 px-4 bg-black text-white text-sm font-medium inline-flex items-center gap-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Plus size={14} /> Add key
          </button>
        </div>
      ) : (
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
          {keys.map((k, i) => (
            <div
              key={k.id}
              className={`px-5 py-3 flex items-center justify-between ${i > 0 ? "border-t border-black/10" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{k.label}</span>
                  <span className="text-xs bg-neutral-100 text-neutral-700 px-1.5 py-0.5">
                    {LABELS[k.provider]}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                  {k.defaultModel ?? "(no default model)"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing(k)}
                  aria-label="Edit"
                  className="p-1.5 hover:bg-neutral-100 text-neutral-600"
                >
                  <Pencil size={13} />
                </button>
                <DeleteKeyButton id={k.id} />
              </div>
            </div>
          ))}
          <div className="border-t border-black/10 px-5 py-3 flex justify-end">
            <button
              onClick={() => setAdding(true)}
              className="h-9 px-3 text-xs border border-black bg-white text-black inline-flex items-center gap-1.5 transition-colors hover:bg-black hover:text-white"
            >
              <Plus size={12} /> Add another
            </button>
          </div>
        </div>
      )}

      {adding && <KeyModal onClose={() => setAdding(false)} />}
      {editing && <KeyModal existing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function DeleteKeyButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  function del() {
    start(async () => {
      await deleteProviderKeyAction({ id });
      setConfirm(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        aria-label="Delete"
        className="p-1.5 hover:bg-neutral-100 text-red-700"
      >
        <Trash2 size={13} />
      </button>
      {confirm && (
        <Modal onClose={pending ? () => {} : () => setConfirm(false)}>
          <h2 className="text-lg font-semibold mb-1">Delete key?</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Suites using this key will need a new one before they can run.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirm(false)}
              disabled={pending}
              className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              onClick={del}
              disabled={pending}
              className="h-9 px-4 bg-red-700 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
            >
              {pending && <Spinner size={14} />}
              {pending ? "Deleting" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function KeyModal({
  existing,
  onClose,
}: {
  existing?: KeyRow;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState<Provider>(existing?.provider ?? "OPENAI");
  const [label, setLabel] = useState(existing?.label ?? "Personal");
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState(existing?.defaultModel ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      try {
        if (existing) {
          await updateProviderKeyAction({
            id: existing.id,
            label,
            apiKey: apiKey || undefined,
            defaultModel: defaultModel || null,
          });
        } else {
          await createProviderKeyAction({
            provider,
            label,
            apiKey,
            defaultModel: defaultModel || null,
          });
        }
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const suggestions = SUGGESTED_MODELS[provider];

  return (
    <Modal onClose={pending ? () => {} : onClose}>
      <h2 className="text-lg font-semibold mb-4">
        {existing ? "Edit provider key" : "Add provider key"}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-neutral-600">Provider</label>
          <div className="flex border border-black mt-1">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => !existing && setProvider(p)}
                disabled={Boolean(existing)}
                className={`flex-1 h-9 px-3 text-xs transition-colors ${
                  provider === p ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-600">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Personal"
            className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:border-black outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-600">
            API key {existing && <span className="text-neutral-400">(leave blank to keep current)</span>}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider === "OPENAI"
                ? "sk-…"
                : provider === "ANTHROPIC"
                  ? "sk-ant-…"
                  : "AIza…"
            }
            className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm font-mono focus:border-black outline-none"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-600">Default model (optional)</label>
          <input
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            placeholder={suggestions[0]}
            list={`models-${provider}`}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm font-mono focus:border-black outline-none"
          />
          <datalist id={`models-${provider}`}>
            {suggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

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
          disabled={pending || !label || (!existing && !apiKey)}
          className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Saving" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] w-full max-w-md p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
