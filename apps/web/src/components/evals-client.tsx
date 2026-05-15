"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Play, ChevronDown, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import {
  createEvalAction,
  updateEvalAction,
  deleteEvalAction,
  createCaseAction,
  updateCaseAction,
  deleteCaseAction,
  runEvalAction,
  createEvalFromTemplateAction,
} from "@/app/(app)/eval-actions";
import { EVAL_TEMPLATES } from "@/lib/eval-templates";
import { LibraryBig } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { ScoreChart } from "@/components/score-chart";
import type { PromptVariable } from "@/lib/variables";

type ProviderKey = {
  id: string;
  provider: "OPENAI" | "ANTHROPIC" | "GOOGLE";
  label: string;
  defaultModel: string | null;
};

const PROVIDER_LABEL: Record<ProviderKey["provider"], string> = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google",
};

const SUGGESTED_MODELS: Record<ProviderKey["provider"], string[]> = {
  OPENAI: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "o4-mini"],
  ANTHROPIC: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-7"],
  GOOGLE: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
};

type ScorerType = "EXACT_MATCH" | "LLM_JUDGE" | "REGEX";

type EvalCase = {
  id: string;
  name: string | null;
  inputVars: Record<string, unknown>;
  expectedOutput: string | null;
  scorerType: ScorerType;
  scorerConfig: Record<string, unknown> | null;
};

export type CaseRunResult = {
  caseId: string;
  caseName: string | null;
  scorerType: ScorerType;
  passed: boolean;
  score: number;
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  error?: string;
  judgeReason?: string;
};

type LastRun = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  score: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  completedAt: string | null;
  createdAt: string;
  results: Array<Record<string, unknown>> | null;
  version: { id: string; commitMessage: string; branchName: string } | null;
};

type HistoryPoint = {
  id: string;
  score: number;
  commitMessage: string;
  createdAt: string;
  regression: boolean;
};

type EvalSuite = {
  id: string;
  name: string;
  providerKeyId: string | null;
  model: string | null;
  createdAt: string;
  cases: EvalCase[];
  lastRun: LastRun | null;
  history: HistoryPoint[];
};

const SCORER_LABEL: Record<ScorerType, string> = {
  EXACT_MATCH: "Exact match",
  LLM_JUDGE: "LLM judge",
  REGEX: "Regex",
};

export function EvalsClient({
  projectSlug,
  promptSlug,
  hasCurrentVersion,
  variables,
  providerKeys,
  evals,
}: {
  projectSlug: string;
  promptSlug: string;
  hasCurrentVersion: boolean;
  variables: PromptVariable[];
  providerKeys: ProviderKey[];
  evals: EvalSuite[];
}) {
  const [creatingSuite, setCreatingSuite] = useState(false);
  const [pickingTemplate, setPickingTemplate] = useState(false);
  const [editingSuite, setEditingSuite] = useState<EvalSuite | null>(null);
  const [editingCase, setEditingCase] = useState<
    { evalId: string; existing?: EvalCase } | null
  >(null);

  const hasKeys = providerKeys.length > 0;

  return (
    <div className="space-y-6">
      {!hasKeys && (
        <div className="bg-amber-50 border border-amber-300 px-4 py-3 text-sm flex items-center justify-between">
          <span>
            Add a provider key in{" "}
            <Link href="/settings" className="underline font-medium">Settings</Link>{" "}
            before running evals.
          </span>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setPickingTemplate(true)}
          className="h-10 px-4 border border-black bg-white text-black text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-black hover:text-white"
        >
          <LibraryBig size={14} /> From template
        </button>
        <button
          onClick={() => setCreatingSuite(true)}
          className="h-10 px-4 bg-black text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <Plus size={14} /> New suite
        </button>
      </div>

      {evals.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-12 text-center">
          <div className="text-lg font-medium mb-1">No eval suites yet</div>
          <p className="text-sm text-neutral-500">
            Create a suite, then add test cases to measure prompt quality.
          </p>
        </div>
      ) : (
        evals.map((e) => (
          <SuiteCard
            key={e.id}
            suite={e}
            projectSlug={projectSlug}
            promptSlug={promptSlug}
            hasCurrentVersion={hasCurrentVersion}
            providerKeys={providerKeys}
            onAddCase={() => setEditingCase({ evalId: e.id })}
            onEditCase={(c) => setEditingCase({ evalId: e.id, existing: c })}
            onEditSuite={() => setEditingSuite(e)}
          />
        ))
      )}

      {creatingSuite && (
        <CreateSuiteModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          providerKeys={providerKeys}
          onClose={() => setCreatingSuite(false)}
        />
      )}

      {pickingTemplate && (
        <TemplatePickerModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          providerKeys={providerKeys}
          promptVariableNames={variables.map((v) => v.name)}
          onClose={() => setPickingTemplate(false)}
        />
      )}

      {editingSuite && (
        <EditSuiteModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          providerKeys={providerKeys}
          suite={editingSuite}
          onClose={() => setEditingSuite(null)}
        />
      )}

      {editingCase && (
        <CaseModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          evalId={editingCase.evalId}
          existing={editingCase.existing}
          variables={variables}
          onClose={() => setEditingCase(null)}
        />
      )}
    </div>
  );
}

function SuiteCard({
  suite,
  projectSlug,
  promptSlug,
  hasCurrentVersion,
  providerKeys,
  onAddCase,
  onEditCase,
  onEditSuite,
}: {
  suite: EvalSuite;
  projectSlug: string;
  promptSlug: string;
  hasCurrentVersion: boolean;
  providerKeys: ProviderKey[];
  onAddCase: () => void;
  onEditCase: (c: EvalCase) => void;
  onEditSuite: () => void;
}) {
  const activeKey =
    providerKeys.find((k) => k.id === suite.providerKeyId) ?? providerKeys[0] ?? null;
  const activeModel =
    suite.model ?? activeKey?.defaultModel ?? (activeKey ? SUGGESTED_MODELS[activeKey.provider][0] : null);
  const hasAnyKey = providerKeys.length > 0;
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(true);

  function deleteSuite() {
    start(async () => {
      await deleteEvalAction({ projectSlug, promptSlug, evalId: suite.id });
      setConfirmDelete(false);
    });
  }

  function deleteCase(caseId: string) {
    start(async () => {
      await deleteCaseAction({ projectSlug, promptSlug, caseId });
    });
  }

  function runSuite() {
    setRunError(null);
    start(async () => {
      try {
        await runEvalAction({ projectSlug, promptSlug, evalId: suite.id });
      } catch (e) {
        setRunError(e instanceof Error ? e.message : "Run failed");
      }
    });
  }

  const canRun = suite.cases.length > 0 && hasCurrentVersion && hasAnyKey;

  return (
    <div className="border border-black/10 bg-white shadow-[6px_6px_0px_#000]">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-3 gap-4">
        <div className="min-w-0">
          <div className="font-medium truncate">{suite.name}</div>
          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              {suite.cases.length} case{suite.cases.length === 1 ? "" : "s"}
            </span>
            {activeKey ? (
              <>
                <span>·</span>
                <span className="font-mono">
                  {PROVIDER_LABEL[activeKey.provider]} / {activeModel ?? "no model"}
                </span>
              </>
            ) : (
              <>
                <span>·</span>
                <span className="text-amber-700">no provider key</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={runSuite}
            disabled={pending || !canRun}
            title={
              !hasCurrentVersion
                ? "Commit a version first"
                : suite.cases.length === 0
                  ? "Add at least one case"
                  : !hasAnyKey
                    ? "Add a provider key in Settings"
                    : undefined
            }
            className="h-8 px-3 text-xs bg-black text-white inline-flex items-center justify-center gap-1.5 transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0"
          >
            {pending ? <Spinner size={12} /> : <Play size={11} />}
            {pending ? "Running" : "Run"}
          </button>
          <button
            onClick={onEditSuite}
            aria-label="Configure suite"
            className="h-8 w-8 border border-neutral-300 hover:bg-neutral-100 inline-flex items-center justify-center"
          >
            <SettingsIcon size={12} />
          </button>
          <button
            onClick={onAddCase}
            className="h-8 px-3 text-xs border border-neutral-300 hover:bg-neutral-100 flex items-center gap-1.5"
          >
            <Plus size={12} /> Add case
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="h-8 px-3 text-xs border border-neutral-300 hover:bg-neutral-100 text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {runError && (
        <div className="px-5 py-2 text-sm text-red-700 bg-red-50 border-b border-red-200">
          {runError}
        </div>
      )}

      {suite.cases.length === 0 ? (
        <div className="px-5 py-6 text-sm text-neutral-500 italic">No cases yet.</div>
      ) : (
        suite.cases.map((c, i) => (
          <div
            key={c.id}
            className={`px-5 py-3 flex items-start justify-between gap-3 ${i > 0 ? "border-t border-black/10" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{c.name ?? "(unnamed case)"}</span>
                <span className="text-xs bg-neutral-100 text-neutral-700 px-1.5 py-0.5">
                  {SCORER_LABEL[c.scorerType]}
                </span>
              </div>
              <div className="text-xs text-neutral-500 mt-1 font-mono truncate">
                {Object.entries(c.inputVars)
                  .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
                  .join(", ") || <span className="italic">no inputs</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditCase(c)}
                aria-label="Edit"
                className="p-1.5 hover:bg-neutral-100 text-neutral-600"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => deleteCase(c.id)}
                disabled={pending}
                aria-label="Delete"
                className="p-1.5 hover:bg-neutral-100 text-red-700"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))
      )}

      {suite.history.length > 0 && (
        <div className="border-t border-black/10 px-5 pt-3 pb-4 bg-white">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-neutral-500">Score history</div>
            {suite.history[suite.history.length - 1]?.regression && (
              <span className="text-xs bg-red-50 text-red-800 border border-red-200 px-2 py-0.5">
                Regression — drop ≥5
              </span>
            )}
          </div>
          <ScoreChart points={suite.history} />
        </div>
      )}

      {suite.lastRun && (
        <RunResults
          run={suite.lastRun}
          cases={suite.cases}
          open={showResults}
          onToggle={() => setShowResults((o) => !o)}
          regression={suite.history[suite.history.length - 1]?.regression ?? false}
        />
      )}

      {confirmDelete && (
        <Modal onClose={pending ? () => {} : () => setConfirmDelete(false)}>
          <h2 className="text-lg font-semibold mb-1">Delete suite?</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Removes <span className="font-medium">{suite.name}</span> and all its{" "}
            {suite.cases.length} case{suite.cases.length === 1 ? "" : "s"}. Past runs stay in
            history.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
              className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              onClick={deleteSuite}
              disabled={pending}
              className="h-9 px-4 bg-red-700 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {pending && <Spinner size={14} />}
              {pending ? "Deleting" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RunResults({
  run,
  cases,
  open,
  onToggle,
  regression,
}: {
  run: LastRun;
  cases: EvalCase[];
  open: boolean;
  onToggle: () => void;
  regression: boolean;
}) {
  const caseLookup = new Map(cases.map((c) => [c.id, c]));
  const results = (run.results ?? []) as unknown as CaseRunResult[];
  const passCount = results.filter((r) => r.passed).length;
  const total = results.length;
  const failed = run.status === "FAILED";
  const running = run.status === "RUNNING";

  return (
    <div className="border-t border-black/10 bg-neutral-50">
      <button
        onClick={onToggle}
        className="w-full px-5 py-3 flex items-center justify-between text-sm hover:bg-neutral-100"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-medium">Latest run</span>
          {failed ? (
            <span className="text-xs bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5">
              failed
            </span>
          ) : running ? (
            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5">
              running
            </span>
          ) : (
            <>
              <span
                className={`text-lg font-black tabular-nums ${regression ? "text-red-700" : ""}`}
              >
                {run.score?.toFixed(1) ?? "—"}
              </span>
              <span className="text-xs text-neutral-500">
                {passCount}/{total} pass
              </span>
              {regression && (
                <span className="text-xs bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5">
                  regression
                </span>
              )}
            </>
          )}
        </div>
        <div className="text-xs text-neutral-500 flex items-center gap-3">
          {run.tokensIn != null && run.tokensOut != null && (
            <span>
              {run.tokensIn + run.tokensOut} tokens
            </span>
          )}
          <span>{new Date(run.createdAt).toLocaleString()}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-black/10">
          {results.length === 0 ? (
            <div className="px-5 py-4 text-sm text-neutral-500 italic">
              No results recorded.
            </div>
          ) : (
            results.map((r, i) => {
              const caseRow = caseLookup.get(r.caseId);
              return (
                <details
                  key={r.caseId + i}
                  className={`px-5 py-3 ${i > 0 ? "border-t border-black/10" : ""}`}
                >
                  <summary className="cursor-pointer flex items-center justify-between gap-3 list-none">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 shrink-0 ${
                          r.passed ? "bg-green-600" : "bg-red-600"
                        }`}
                        aria-label={r.passed ? "passed" : "failed"}
                      />
                      <span className="text-sm truncate">
                        {r.caseName ?? caseRow?.name ?? "(unnamed)"}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {SCORER_LABEL[r.scorerType]}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-3">
                      <span className="tabular-nums">
                        {(r.score * 100).toFixed(0)}
                      </span>
                      <span>{r.latencyMs}ms</span>
                    </div>
                  </summary>

                  {r.error ? (
                    <p className="mt-3 text-xs text-red-700">{r.error}</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-neutral-500 mb-1">Output</div>
                        <pre className="font-mono whitespace-pre-wrap break-words bg-white border border-neutral-200 p-2 max-h-48 overflow-auto">
                          {r.output || <span className="text-neutral-400 italic">(empty)</span>}
                        </pre>
                      </div>
                      <div>
                        {r.scorerType === "EXACT_MATCH" && caseRow?.expectedOutput != null && (
                          <>
                            <div className="text-neutral-500 mb-1">Expected</div>
                            <pre className="font-mono whitespace-pre-wrap break-words bg-white border border-neutral-200 p-2 max-h-48 overflow-auto">
                              {caseRow.expectedOutput}
                            </pre>
                          </>
                        )}
                        {r.scorerType === "REGEX" && (
                          <>
                            <div className="text-neutral-500 mb-1">Pattern</div>
                            <pre className="font-mono whitespace-pre-wrap break-words bg-white border border-neutral-200 p-2">
                              {(caseRow?.scorerConfig?.pattern as string | undefined) ?? "—"}
                            </pre>
                          </>
                        )}
                        {r.scorerType === "LLM_JUDGE" && (
                          <>
                            <div className="text-neutral-500 mb-1">Judge reason</div>
                            <pre className="font-mono whitespace-pre-wrap break-words bg-white border border-neutral-200 p-2 max-h-48 overflow-auto">
                              {r.judgeReason ?? "—"}
                            </pre>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </details>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function CreateSuiteModal({
  projectSlug,
  promptSlug,
  providerKeys,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  providerKeys: ProviderKey[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [providerKeyId, setProviderKeyId] = useState<string>(providerKeys[0]?.id ?? "");
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selectedKey = providerKeys.find((k) => k.id === providerKeyId);

  function submit() {
    setError(null);
    start(async () => {
      try {
        await createEvalAction({
          projectSlug,
          promptSlug,
          name,
          providerKeyId: providerKeyId || null,
          model: model || null,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose}>
      <h2 className="text-lg font-semibold mb-4">New eval suite</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-neutral-600">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer support quality"
            className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:border-black outline-none"
            autoFocus
          />
        </div>
        <ModelSelector
          providerKeys={providerKeys}
          providerKeyId={providerKeyId}
          model={model}
          onProviderKeyChange={setProviderKeyId}
          onModelChange={setModel}
          selectedKey={selectedKey}
        />
      </div>
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
          disabled={pending || !name.trim()}
          className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Creating" : "Create"}
        </button>
      </div>
    </Modal>
  );
}

function EditSuiteModal({
  projectSlug,
  promptSlug,
  providerKeys,
  suite,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  providerKeys: ProviderKey[];
  suite: EvalSuite;
  onClose: () => void;
}) {
  const [name, setName] = useState(suite.name);
  const [providerKeyId, setProviderKeyId] = useState<string>(suite.providerKeyId ?? "");
  const [model, setModel] = useState(suite.model ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selectedKey = providerKeys.find((k) => k.id === providerKeyId);

  function submit() {
    setError(null);
    start(async () => {
      try {
        await updateEvalAction({
          projectSlug,
          promptSlug,
          evalId: suite.id,
          name,
          providerKeyId: providerKeyId || null,
          model: model || null,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose}>
      <h2 className="text-lg font-semibold mb-4">Configure suite</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-neutral-600">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:border-black outline-none"
          />
        </div>
        <ModelSelector
          providerKeys={providerKeys}
          providerKeyId={providerKeyId}
          model={model}
          onProviderKeyChange={setProviderKeyId}
          onModelChange={setModel}
          selectedKey={selectedKey}
        />
      </div>
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
          disabled={pending || !name.trim()}
          className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Saving" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

function ModelSelector({
  providerKeys,
  providerKeyId,
  model,
  onProviderKeyChange,
  onModelChange,
  selectedKey,
}: {
  providerKeys: ProviderKey[];
  providerKeyId: string;
  model: string;
  onProviderKeyChange: (id: string) => void;
  onModelChange: (m: string) => void;
  selectedKey: ProviderKey | undefined;
}) {
  if (providerKeys.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-300 px-3 py-2 text-xs">
        No provider keys yet —{" "}
        <Link href="/settings" className="underline font-medium">add one in Settings</Link>.
      </div>
    );
  }

  const suggestions = selectedKey ? SUGGESTED_MODELS[selectedKey.provider] : [];
  const placeholder =
    selectedKey?.defaultModel ?? (selectedKey ? SUGGESTED_MODELS[selectedKey.provider][0] : "");

  return (
    <>
      <div>
        <label className="text-xs text-neutral-600">Provider key</label>
        <select
          value={providerKeyId}
          onChange={(e) => onProviderKeyChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:border-black outline-none bg-white"
        >
          <option value="">(auto: first available)</option>
          {providerKeys.map((k) => (
            <option key={k.id} value={k.id}>
              {PROVIDER_LABEL[k.provider]} — {k.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-neutral-600">
          Model {selectedKey && <span className="text-neutral-400">(leave blank to use key default)</span>}
        </label>
        <input
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder={placeholder}
          list={`models-${providerKeyId || "any"}`}
          className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm font-mono focus:border-black outline-none"
        />
        <datalist id={`models-${providerKeyId || "any"}`}>
          {suggestions.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
    </>
  );
}

function CaseModal({
  projectSlug,
  promptSlug,
  evalId,
  existing,
  variables,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  evalId: string;
  existing?: EvalCase;
  variables: PromptVariable[];
  onClose: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const initialInputs: Record<string, string> = {};
  variables.forEach((v) => {
    const val = existing?.inputVars[v.name];
    initialInputs[v.name] = val !== undefined ? String(val) : (v.default ?? "");
  });
  const [inputs, setInputs] = useState<Record<string, string>>(initialInputs);
  const [scorerType, setScorerType] = useState<ScorerType>(existing?.scorerType ?? "EXACT_MATCH");
  const [expectedOutput, setExpectedOutput] = useState(existing?.expectedOutput ?? "");
  const [regexPattern, setRegexPattern] = useState(
    (existing?.scorerConfig?.pattern as string | undefined) ?? ""
  );
  const [judgeRubric, setJudgeRubric] = useState(
    (existing?.scorerConfig?.rubric as string | undefined) ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function buildPayload() {
    const inputVars: Record<string, unknown> = {};
    for (const v of variables) {
      const raw = inputs[v.name] ?? "";
      if (v.type === "number") inputVars[v.name] = Number(raw);
      else if (v.type === "boolean") inputVars[v.name] = raw === "true";
      else inputVars[v.name] = raw;
    }

    let scorerConfig: Record<string, unknown> | null = null;
    if (scorerType === "REGEX") scorerConfig = { pattern: regexPattern };
    if (scorerType === "LLM_JUDGE") scorerConfig = { rubric: judgeRubric };

    return {
      name: name || undefined,
      inputVars,
      expectedOutput: scorerType === "EXACT_MATCH" ? expectedOutput : null,
      scorerType,
      scorerConfig,
    };
  }

  function submit() {
    setError(null);
    const payload = buildPayload();
    start(async () => {
      try {
        if (existing) {
          await updateCaseAction({ projectSlug, promptSlug, caseId: existing.id, ...payload });
        } else {
          await createCaseAction({ projectSlug, promptSlug, evalId, ...payload });
        }
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose} wide>
      <h2 className="text-lg font-semibold mb-4">
        {existing ? "Edit case" : "New case"}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-neutral-600">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Polite greeting case"
            className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm"
          />
        </div>

        <div>
          <div className="text-xs text-neutral-600 mb-1.5">Input variables</div>
          {variables.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">
              The current version has no variables — this case will run as-is.
            </p>
          ) : (
            <div className="space-y-3">
              {variables.map((v) => (
                <div key={v.name}>
                  <label className="text-xs font-mono block mb-1 break-all">
                    {v.name}
                    <span className="text-blue-700">:{v.type}</span>
                  </label>
                  <input
                    value={inputs[v.name] ?? ""}
                    onChange={(e) => setInputs((p) => ({ ...p, [v.name]: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-neutral-300 text-sm font-mono"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-neutral-600">Scorer</label>
          <div className="flex border border-neutral-300 mt-1">
            {(["EXACT_MATCH", "LLM_JUDGE", "REGEX"] as ScorerType[]).map((s) => (
              <button
                key={s}
                onClick={() => setScorerType(s)}
                className={`flex-1 px-3 py-1.5 text-xs ${
                  scorerType === s ? "bg-neutral-900 text-white" : "bg-white text-neutral-700"
                }`}
              >
                {SCORER_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {scorerType === "EXACT_MATCH" && (
          <div>
            <label className="text-xs text-neutral-600">Expected output</label>
            <textarea
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm font-mono min-h-[100px]"
            />
          </div>
        )}

        {scorerType === "REGEX" && (
          <div>
            <label className="text-xs text-neutral-600">Regex pattern</label>
            <input
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="^Hello, .+!$"
              className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm font-mono"
            />
          </div>
        )}

        {scorerType === "LLM_JUDGE" && (
          <div>
            <label className="text-xs text-neutral-600">Judge rubric</label>
            <textarea
              value={judgeRubric}
              onChange={(e) => setJudgeRubric(e.target.value)}
              placeholder="Output must greet the user by name and stay under 100 words."
              className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm min-h-[80px]"
            />
          </div>
        )}
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
          disabled={pending}
          className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Saving" : "Save case"}
        </button>
      </div>
    </Modal>
  );
}

function TemplatePickerModal({
  projectSlug,
  promptSlug,
  providerKeys,
  promptVariableNames,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  providerKeys: ProviderKey[];
  promptVariableNames: string[];
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [providerKeyId, setProviderKeyId] = useState<string>(providerKeys[0]?.id ?? "");
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selected = EVAL_TEMPLATES.find((t) => t.id === selectedId);
  const selectedKey = providerKeys.find((k) => k.id === providerKeyId);
  const promptVarSet = new Set(promptVariableNames);

  function submit() {
    if (!selectedId) return;
    setError(null);
    start(async () => {
      try {
        await createEvalFromTemplateAction({
          projectSlug,
          promptSlug,
          templateId: selectedId,
          name: name || undefined,
          providerKeyId: providerKeyId || null,
          model: model || null,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose} wide>
      <h2 className="text-lg font-semibold mb-1">Pick an eval template</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Each template seeds a suite with several cases. You can edit or remove cases after creation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EVAL_TEMPLATES.map((t) => {
          const missing = t.expects.filter((v) => !promptVarSet.has(v));
          const isSelected = selectedId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedId(t.id);
                if (!name) setName(t.name);
              }}
              className={`text-left p-4 border ${
                isSelected
                  ? "border-black bg-neutral-50 shadow-[3px_3px_0px_#000]"
                  : "border-black/10 hover:border-black/40"
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                {t.description}
              </p>
              <div className="text-xs text-neutral-500 mt-3 flex items-center gap-2 flex-wrap">
                <span>{t.cases.length} cases</span>
                {t.expects.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-mono">
                      expects: {t.expects.map((v) => `{{${v}}}`).join(", ")}
                    </span>
                  </>
                )}
              </div>
              {missing.length > 0 && (
                <div className="text-xs text-amber-700 mt-2">
                  Missing from current version: {missing.map((m) => `{{${m}}}`).join(", ")}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-6 border-t border-black/10 pt-5 space-y-3">
          <div>
            <label className="text-xs text-neutral-600">Suite name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm focus:border-black outline-none"
            />
          </div>
          <ModelSelector
            providerKeys={providerKeys}
            providerKeyId={providerKeyId}
            model={model}
            onProviderKeyChange={setProviderKeyId}
            onModelChange={setModel}
            selectedKey={selectedKey}
          />
        </div>
      )}

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
          disabled={pending || !selectedId || !name.trim()}
          className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {pending && <Spinner size={14} />}
          {pending ? "Creating" : "Create suite"}
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
        className={`bg-white border border-black/10 shadow-[6px_6px_0px_#000] w-full ${wide ? "max-w-2xl" : "max-w-md"} p-6 max-h-[90vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
