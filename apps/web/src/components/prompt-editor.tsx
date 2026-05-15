"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import { commitVersionAction } from "@/app/(app)/actions";
import { parseVariables, renderWithDefaults, VAR_RE } from "@/lib/variables";
import { Spinner } from "@/components/spinner";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(text: string) {
  const escaped = escapeHtml(text);
  return (
    escaped.replace(VAR_RE, (match, name, type, def) => {
      const nameHtml = `<span class="text-amber-900 font-medium">${name}</span>`;
      const typeHtml = type
        ? `<span class="text-blue-700">: ${type}</span>`
        : "";
      const defHtml = def
        ? `<span class="text-emerald-700"> = ${escapeHtml(def)}</span>`
        : "";
      return `<span class="bg-amber-100 border-b border-amber-300">{{${nameHtml}${typeHtml}${defHtml}}}</span>`;
    }) + "\n"
  );
}

export function PromptEditor({
  projectSlug,
  promptSlug,
  branchName,
  initialContent,
  hasVersion,
}: {
  projectSlug: string;
  promptSlug: string;
  branchName: string;
  initialContent: string;
  hasVersion: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [pending, start] = useTransition();
  const preRef = useRef<HTMLPreElement>(null);

  const dirty = content !== initialContent;
  const variables = useMemo(() => parseVariables(content), [content]);
  const preview = useMemo(() => renderWithDefaults(content, variables), [content, variables]);

  function onScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }

  function commit() {
    setError(null);
    start(async () => {
      try {
        await commitVersionAction({
          projectSlug,
          promptSlug,
          branchName,
          content,
          commitMessage: message,
        });
        setCommitting(false);
        setMessage("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-neutral-500">
          Use <span className="font-mono">{`{{name: type = default}}`}</span> to declare variables.
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
          <div className="flex border border-neutral-300">
            <button
              onClick={() => setPreviewing(false)}
              className={`px-4 py-1.5 text-sm ${!previewing ? "bg-neutral-900 text-white" : "bg-white text-neutral-700"}`}
            >
              Edit
            </button>
            <button
              onClick={() => setPreviewing(true)}
              className={`px-4 py-1.5 text-sm ${previewing ? "bg-neutral-900 text-white" : "bg-white text-neutral-700"}`}
            >
              Preview
            </button>
          </div>
          <button
            onClick={() => setCommitting(true)}
            disabled={!dirty && hasVersion}
            className="px-4 py-1.5 bg-black text-white text-sm font-medium disabled:opacity-40"
          >
            {hasVersion ? "Commit" : "Commit first version"}
          </button>
        </div>
      </div>

      {previewing ? (
        <pre className="border border-neutral-300 bg-white p-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words min-h-[420px]">
          {preview}
        </pre>
      ) : (
        <div className="relative border border-neutral-300 bg-white">
          <pre
            ref={preRef}
            aria-hidden
            className="absolute inset-0 m-0 p-4 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-neutral-900 pointer-events-none"
            dangerouslySetInnerHTML={{ __html: highlight(content) }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onScroll={onScroll}
            spellCheck={false}
            placeholder={"You are a helpful assistant. Greet {{user_name: string = \"there\"}} and help them."}
            className="relative w-full min-h-[420px] p-4 font-mono text-sm leading-6 bg-transparent text-transparent caret-neutral-900 resize-y outline-none whitespace-pre-wrap break-words"
          />
        </div>
      )}

      {variables.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Variables</h3>
          <div className="border border-neutral-200 bg-white">
            <div className="grid grid-cols-12 px-4 py-2 text-xs text-neutral-500 border-b border-neutral-200 bg-neutral-50">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-5">Default</div>
            </div>
            {variables.map((v) => (
              <div key={v.name} className="grid grid-cols-12 px-4 py-2 text-sm border-b last:border-b-0 border-neutral-200">
                <div className="col-span-4 font-mono">{v.name}</div>
                <div className="col-span-3 font-mono text-blue-700">{v.type}</div>
                <div className="col-span-5 font-mono text-neutral-600">
                  {v.default === null ? <span className="text-neutral-400 italic">none</span> : v.default}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {committing && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => !pending && setCommitting(false)}
        >
          <div
            className="bg-white shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1">Commit changes</h2>
            <p className="text-sm text-neutral-500 mb-4">Describe what changed and why.</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Fix tone in greeting"
              className="w-full px-3 py-2 border border-neutral-300 text-sm min-h-[80px]"
              autoFocus
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setCommitting(false)}
                disabled={pending}
                className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={commit}
                disabled={pending || !message.trim()}
                className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {pending && <Spinner size={14} />}
                {pending ? "Committing" : "Commit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
