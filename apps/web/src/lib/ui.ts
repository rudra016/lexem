// Brutalist UI tokens (matches login/signup).
// Corners are globally squared via globals.css; depth comes from hard offset shadows.

export const BTN_PRIMARY =
  "h-10 px-4 bg-black text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0";

export const BTN_OUTLINE =
  "h-10 px-4 border border-black bg-white text-black text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-black hover:text-white disabled:opacity-50";

export const BTN_GHOST =
  "h-10 px-4 text-sm text-neutral-700 hover:bg-neutral-100 inline-flex items-center justify-center gap-2 disabled:opacity-50";

export const BTN_DANGER =
  "h-10 px-4 bg-red-700 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0";

export const BTN_SM_PRIMARY =
  "h-8 px-3 bg-black text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0";

export const BTN_SM_OUTLINE =
  "h-8 px-3 border border-black bg-white text-black text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-black hover:text-white disabled:opacity-50";

export const INPUT =
  "w-full px-3 py-2 border border-neutral-300 bg-white text-sm outline-none focus:border-black";

export const INPUT_MONO = INPUT + " font-mono";

export const TEXTAREA =
  "w-full px-3 py-2 border border-neutral-300 bg-white text-sm outline-none focus:border-black";

export const CARD =
  "bg-white border border-black/10 shadow-[6px_6px_0px_#000]";

export const CARD_FLAT = "bg-white border border-black/10";

export const MODAL =
  "bg-white border border-black/10 shadow-[6px_6px_0px_#000] w-full p-6 max-h-[90vh] overflow-auto";
