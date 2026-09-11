export type AppSnackbarTone = "neutral" | "success" | "warning" | "danger";

export type AppSnackbarSnapshot = {
  id: number;
  message: string;
  tone: AppSnackbarTone;
  durationMs: number;
};

let nextId = 1;
let current: AppSnackbarSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function showAppSnackbar(
  message: string,
  options?: { tone?: AppSnackbarTone; durationMs?: number },
) {
  current = {
    id: nextId++,
    message,
    tone: options?.tone ?? "neutral",
    durationMs: options?.durationMs ?? 3200,
  };
  emit();
}

export function subscribeAppSnackbar(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAppSnackbarSnapshot() {
  return current;
}

export function dismissAppSnackbar(id?: number) {
  if (!current || (id != null && current.id !== id)) return;
  current = null;
  emit();
}
