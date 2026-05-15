"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  createEvalAction,
  deleteEvalAction,
  createCaseAction,
  updateCaseAction,
  deleteCaseAction,
} from "@/app/(app)/eval-actions";
import { Spinner } from "@/components/spinner";
import type { PromptVariable } from "@/lib/variables";

type ScorerType = "EXACT_MATCH" | "LLM_JUDGE" | "REGEX";

type EvalCase = {
  id: string;
  name: string | null;
  inputVars: Record<string, unknown>;
  expectedOutput: string | null;
  scorerType: ScorerType;
  scorerConfig: Record<string, unknown> | null;
};

type EvalSuite = {
  id: string;
  name: string;
  createdAt: string;
  cases: EvalCase[];
};

const SCORER_LABEL: Record<ScorerType, string> = {
  EXACT_MATCH: "Exact match",
  LLM_JUDGE: "LLM judge",
  REGEX: "Regex",
};

export function EvalsClient({
  projectSlug,
  promptSlug,
  variables,
  evals,
}: {
  projectSlug: string;
  promptSlug: string;
  variables: PromptVariable[];
  evals: EvalSuite[];
}) {
  const [creatingSuite, setCreatingSuite] = useState(false);
  const [editingCase, setEditingCase] = useState<
    { evalId: string; existing?: EvalCase } | null
  >(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setCreatingSuite(true)}
          className="h-9 px-4 bg-black text-white text-sm font-medium flex items-center gap-2"
        >
          <Plus size={14} /> New suite
        </button>
      </div>

      {evals.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 p-12 text-center">
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
            onAddCase={() => setEditingCase({ evalId: e.id })}
            onEditCase={(c) => setEditingCase({ evalId: e.id, existing: c })}
          />
        ))
      )}

      {creatingSuite && (
        <CreateSuiteModal
          projectSlug={projectSlug}
          promptSlug={promptSlug}
          onClose={() => setCreatingSuite(false)}
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
  onAddCase,
  onEditCase,
}: {
  suite: EvalSuite;
  projectSlug: string;
  promptSlug: string;
  onAddCase: () => void;
  onEditCase: (c: EvalCase) => void;
}) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  return (
    <div className="border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
        <div>
          <div className="font-medium">{suite.name}</div>
          <div className="text-xs text-neutral-500">
            {suite.cases.length} case{suite.cases.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            Delete suite
          </button>
        </div>
      </div>

      {suite.cases.length === 0 ? (
        <div className="px-5 py-6 text-sm text-neutral-500 italic">No cases yet.</div>
      ) : (
        suite.cases.map((c, i) => (
          <div
            key={c.id}
            className={`px-5 py-3 flex items-start justify-between gap-3 ${i > 0 ? "border-t border-neutral-200" : ""}`}
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

function CreateSuiteModal({
  projectSlug,
  promptSlug,
  onClose,
}: {
  projectSlug: string;
  promptSlug: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      try {
        await createEvalAction({ projectSlug, promptSlug, name });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Modal onClose={pending ? () => {} : onClose}>
      <h2 className="text-lg font-semibold mb-4">New eval suite</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Customer support quality"
        className="w-full px-3 py-2 border border-neutral-300 text-sm"
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
        className={`bg-white shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} p-6 max-h-[90vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
