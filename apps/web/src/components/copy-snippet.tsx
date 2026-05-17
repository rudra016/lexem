"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopySnippet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="mt-8 inline-flex items-stretch border border-black bg-white shadow-[4px_4px_0px_#000] transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer group"
      aria-label="Copy install command"
    >
      <span className="px-3 flex items-center text-neutral-400 font-mono text-sm border-r border-black/10 select-none">
        $
      </span>
      <code className="px-4 py-3 font-mono text-sm text-neutral-900">
        {text}
      </code>
      <span className="px-3 flex items-center border-l border-black/10 text-neutral-400 transition-colors group-hover:text-neutral-700">
        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
      </span>
    </button>
  );
}
