export type LexemClientOptions = {
  /** Project API key, e.g. `lxm_...`. */
  apiKey: string;
  /** Base URL for the Lexem API. Defaults to `https://api.lexem.site`. */
  baseUrl?: string;
  /**
   * In-memory cache TTL in milliseconds for `get()` results. Defaults to
   * 30_000 (30s). Set to 0 to disable caching entirely.
   */
  cacheTtlMs?: number;
  /**
   * Custom fetch implementation. Defaults to global `fetch` (Node 18+,
   * modern browsers). Useful for testing or environments without `fetch`.
   */
  fetch?: typeof fetch;
};

export type GetOptions = {
  /** Environment name (e.g. `"production"`). Omit to fetch the current main-branch head. */
  env?: string;
  /** Bypass the in-memory cache for this single call. */
  fresh?: boolean;
  /** AbortSignal for the underlying HTTP request. */
  signal?: AbortSignal;
};

/**
 * A variable declared by the prompt's author when the version was committed.
 * Lexem parses `{{name}}` (and `{{name: type}}`) placeholders out of the
 * prompt content; this is the parsed list, with the optional declared type
 * and default value preserved.
 */
export type PromptVariable = {
  name: string;
  type: string | null;
  default: string | null;
};

/**
 * The full variables schema for a version. `null` when the version has no
 * declared variables (e.g. a static prompt with no `{{placeholders}}`).
 */
export type PromptVariables = PromptVariable[] | null;

export type PromptResult = {
  /** The prompt text, including any `{{variable}}` placeholders. */
  content: string;
  /** ID of the version this response was served from. */
  versionId: string;
  /** Declared variables for this version, or `null`. */
  variables: PromptVariables;
  /** The environment requested, or `"current"` if `env` was omitted. */
  env: string;
  /** ISO-8601 timestamp the SDK received this response. */
  fetchedAt: string;
};

/**
 * Token usage report payload for `logUsage()`. Sent to `POST /v1/usage` so
 * it shows up in the project's analytics dashboard.
 */
export type LogUsageInput = {
  /** The `versionId` returned from a previous `get()` call. */
  versionId: string;
  /** Non-negative integer count of input tokens. */
  tokensIn: number;
  /** Non-negative integer count of output tokens. */
  tokensOut: number;
  /** Optional environment name the version was fetched for. */
  env?: string;
};

export type LogUsageOptions = {
  /** AbortSignal for the underlying HTTP request. */
  signal?: AbortSignal;
};

export class LexemError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LexemError";
    this.status = status;
  }
}
