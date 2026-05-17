/**
 * Substitute `{{variable}}` placeholders in `template` with values from `vars`.
 *
 * - Names match `[a-zA-Z_][a-zA-Z0-9_]*` (same alphabet Lexem's editor uses).
 * - Whitespace inside braces is tolerated: `{{ name }}` works.
 * - Missing variables throw `Error` by default. Pass `{ missing: "leave" }` to
 *   keep the placeholder verbatim, or `{ missing: "empty" }` to substitute "".
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | boolean>,
  opts: { missing?: "throw" | "leave" | "empty" } = {},
): string {
  const missing = opts.missing ?? "throw";
  return template.replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
    (raw, name: string) => {
      if (Object.prototype.hasOwnProperty.call(vars, name)) {
        return String(vars[name]);
      }
      if (missing === "leave") return raw;
      if (missing === "empty") return "";
      throw new Error(`Missing variable "${name}" required by prompt template.`);
    },
  );
}
