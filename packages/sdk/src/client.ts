import { TtlCache } from "./cache.js";
import { renderTemplate } from "./render.js";
import {
  LexemError,
  type GetOptions,
  type LexemClientOptions,
  type PromptResult,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.lexem.site";
const DEFAULT_CACHE_TTL_MS = 30_000;

export type RenderOptions = GetOptions & {
  /** How to handle variables present in the template but missing from `vars`. */
  missing?: "throw" | "leave" | "empty";
};

export class LexemClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: TtlCache<PromptResult>;
  private fetchImpl: typeof fetch;

  constructor(opts: LexemClientOptions) {
    if (!opts.apiKey) {
      throw new LexemError("apiKey is required");
    }
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.cache = new TtlCache<PromptResult>(
      opts.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
    );
    if (opts.fetch) {
      this.fetchImpl = opts.fetch;
    } else if (typeof fetch === "function") {
      this.fetchImpl = fetch;
    } else {
      throw new LexemError(
        "No fetch implementation available. Pass `fetch` in options or use Node 18+.",
      );
    }
  }

  /**
   * Fetch the active version of a prompt for a given environment (or the
   * current main-branch head if `env` is omitted).
   */
  async get(slug: string, opts: GetOptions = {}): Promise<PromptResult> {
    if (!slug) throw new LexemError("slug is required");

    const cacheKey = `${slug}:${opts.env ?? "__current__"}`;
    if (!opts.fresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const url = new URL(`${this.baseUrl}/v1/prompts/${encodeURIComponent(slug)}`);
    if (opts.env) url.searchParams.set("env", opts.env);

    const res = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      signal: opts.signal,
    });

    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        /* ignore */
      }
      const message =
        (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
          ? (body as { error: string }).error
          : null) ?? `Lexem API error ${res.status}`;
      throw new LexemError(message, res.status);
    }

    const data = (await res.json()) as PromptResult;
    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * Fetch a prompt and substitute `{{variable}}` placeholders with `vars`.
   * Returns the rendered string. For the underlying metadata, use `get()`.
   */
  async render(
    slug: string,
    vars: Record<string, string | number | boolean>,
    opts: RenderOptions = {},
  ): Promise<string> {
    const { missing, ...getOpts } = opts;
    const prompt = await this.get(slug, getOpts);
    return renderTemplate(prompt.content, vars, { missing });
  }

  /** Drop all cached entries. Useful in tests or after a redeploy. */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create a Lexem client.
 *
 * ```ts
 * import { createClient } from "@lexem/sdk";
 *
 * const lexem = createClient({ apiKey: process.env.LEXEM_API_KEY! });
 * const p = await lexem.get("summarizer", { env: "production" });
 * ```
 */
export function createClient(opts: LexemClientOptions): LexemClient {
  return new LexemClient(opts);
}
