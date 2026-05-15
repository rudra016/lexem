export type VarType = "string" | "number" | "boolean";

export type PromptVariable = {
  name: string;
  type: VarType;
  default: string | null;
};

const VAR_RE =
  /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*(string|number|boolean))?(?:\s*=\s*([^}]+?))?\s*\}\}/g;

export function parseVariables(content: string): PromptVariable[] {
  const map = new Map<string, PromptVariable>();
  for (const m of content.matchAll(VAR_RE)) {
    const [, name, type, def] = m;
    const existing = map.get(name);
    const variable: PromptVariable = {
      name,
      type: (type as VarType) ?? existing?.type ?? "string",
      default: def?.trim().replace(/^["']|["']$/g, "") ?? existing?.default ?? null,
    };
    map.set(name, variable);
  }
  return Array.from(map.values());
}

export function renderWithDefaults(content: string, vars: PromptVariable[]): string {
  const lookup = new Map(vars.map((v) => [v.name, v]));
  return content.replace(VAR_RE, (_, name: string) => {
    const v = lookup.get(name);
    if (!v || v.default === null) return `{{${name}}}`;
    return v.default;
  });
}

export { VAR_RE };
