import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { sessionStorage } from "@/infrastructure/auth/session-storage";
import { request } from "@/infrastructure/networking/api-client";
import { ApiError } from "@/shared/errors/api-error";

const STORAGE_KEY = "AI_PM_OFFLINE_MUTATION_QUEUE_V1";
const MAX_QUEUE_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 5;

export type OfflineMutationStatus = "queued" | "conflict" | "failed";

export type OfflineMutationItem = {
  id: string;
  endpoint: string;
  method: "POST" | "PATCH";
  body?: string;
  orgId?: string | null;
  userId?: string | null;
  label: string;
  createdAt: string;
  attempts: number;
  status: OfflineMutationStatus;
  lastError?: string | null;
};

export type OfflineMutationReceipt = {
  queued: true;
  queueId: string;
};

export type OfflineQueueStats = {
  total: number;
  queued: number;
  conflicts: number;
  failed: number;
  flushed: number;
};

type QueueableRequest = {
  endpoint: string;
  method: OfflineMutationItem["method"];
  body?: unknown;
  orgId?: string | null;
  label: string;
};

const listeners = new Set<() => void>();
let flushing = false;

function emitChange() {
  for (const listener of listeners) listener();
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readQueue(): Promise<OfflineMutationItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as OfflineMutationItem[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: OfflineMutationItem[]) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(-MAX_QUEUE_SIZE)),
  );
  emitChange();
}

function statsFor(
  items: OfflineMutationItem[],
  flushed = 0,
): OfflineQueueStats {
  return {
    total: items.length,
    queued: items.filter((item) => item.status === "queued").length,
    conflicts: items.filter((item) => item.status === "conflict").length,
    failed: items.filter((item) => item.status === "failed").length,
    flushed,
  };
}

async function enqueue(
  input: QueueableRequest,
): Promise<OfflineMutationReceipt> {
  const [orgId, userId] = await Promise.all([
    input.orgId ?? sessionStorage.getOrgId(),
    sessionStorage.getUserId(),
  ]);
  const item: OfflineMutationItem = {
    id: newId(),
    endpoint: input.endpoint,
    method: input.method,
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    orgId: orgId ?? null,
    userId: userId ?? null,
    label: input.label,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: "queued",
    lastError: null,
  };
  const items = await readQueue();
  await writeQueue([...items, item]);
  return { queued: true, queueId: item.id };
}

export function isOfflineMutationReceipt(
  value: unknown,
): value is OfflineMutationReceipt {
  return Boolean(
    value &&
    typeof value === "object" &&
    "queued" in value &&
    (value as { queued?: unknown }).queued === true,
  );
}

export async function runQueueableRequest<T>(
  input: QueueableRequest,
): Promise<T | OfflineMutationReceipt> {
  const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false)
    return enqueue(input);

  try {
    return await request<T>(input.endpoint, {
      method: input.method,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
    });
  } catch (error) {
    if (!(error instanceof ApiError)) return enqueue(input);
    throw error;
  }
}

export async function getOfflineQueueStats() {
  return statsFor(await readQueue());
}

export async function getOfflineQueueItems() {
  return readQueue();
}

export function subscribeOfflineQueue(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function clearOfflineMutationQueue() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  emitChange();
}

export async function retryOfflineMutationFailures() {
  const items = await readQueue();
  await writeQueue(
    items.map((item) =>
      item.status !== "failed"
        ? item
        : {
            ...item,
            status: "queued" as const,
            attempts: 0,
            lastError: null,
          },
    ),
  );
}

export async function flushOfflineMutationQueue(): Promise<OfflineQueueStats> {
  if (flushing) return getOfflineQueueStats();
  const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false)
    return getOfflineQueueStats();

  flushing = true;
  let flushed = 0;
  try {
    let items = await readQueue();
    const currentUserId = await sessionStorage.getUserId();
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item.status !== "queued") continue;

      if (item.userId && item.userId !== currentUserId) {
        items[index] = {
          ...item,
          status: "failed",
          lastError: "Queued action belongs to a different signed-in user",
        };
        await writeQueue(items);
        break;
      }

      try {
        await request(item.endpoint, {
          method: item.method,
          body: item.body,
          headers: item.orgId ? { "x-org-id": item.orgId } : undefined,
        });
        items.splice(index, 1);
        index -= 1;
        flushed += 1;
        await writeQueue(items);
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 409 || error.status === 412)
        ) {
          items[index] = {
            ...item,
            status: "conflict",
            attempts: item.attempts + 1,
            lastError: error.message,
          };
          await writeQueue(items);
          break;
        }

        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          items[index] = {
            ...item,
            status: "failed",
            attempts: item.attempts + 1,
            lastError: error.message,
          };
          await writeQueue(items);
          break;
        }

        const attempts = item.attempts + 1;
        items[index] = {
          ...item,
          attempts,
          status: attempts >= MAX_RETRY_ATTEMPTS ? "failed" : "queued",
          lastError: error instanceof Error ? error.message : String(error),
        };
        await writeQueue(items);
        break;
      }
    }
    return statsFor(items, flushed);
  } finally {
    flushing = false;
  }
}
