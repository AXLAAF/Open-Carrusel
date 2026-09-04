import { readDataSafe, updateData } from "./data";
import { generateId, now } from "./utils";
import type {
  StagedAction,
  StagedActionsData,
  StagedActionType,
  StagedActionStatus,
} from "@/types/staged-action";

const FILE = "staged-actions.json";
const EMPTY: StagedActionsData = { actions: [] };
const MAX_CONTENT_CHARS = 8 * 1024 * 1024;
const MAX_ACTIONS = 40;

async function load(): Promise<StagedActionsData> {
  return readDataSafe<StagedActionsData>(FILE, EMPTY);
}

function prune(data: StagedActionsData): void {
  if (data.actions.length <= MAX_ACTIONS) return;
  const drop = data.actions.length - MAX_ACTIONS;
  const resolvedIdx = data.actions
    .map((a, i) => (a.status !== "pending" ? i : -1))
    .filter((i) => i >= 0);
  const toRemove = new Set(
    (resolvedIdx.length >= drop ? resolvedIdx : data.actions.map((_, i) => i)).slice(
      0,
      drop
    )
  );
  data.actions = data.actions.filter((_, i) => !toRemove.has(i));
}

export async function listStagedActions(): Promise<StagedAction[]> {
  const data = await load();
  return data.actions;
}

export async function getStagedAction(
  id: string
): Promise<StagedAction | null> {
  const data = await load();
  return data.actions.find((a) => a.id === id) ?? null;
}

export async function createStagedAction(params: {
  type: StagedActionType;
  fileName: string;
  content: string;
  description: string;
  carouselId: string;
  autoExecute?: boolean;
}): Promise<StagedAction> {
  if (params.content.length > MAX_CONTENT_CHARS) {
    throw new Error("Staged action content exceeds size limit");
  }
  let action!: StagedAction;
  await updateData<StagedActionsData>(FILE, EMPTY, (data) => {
    action = {
      id: generateId(),
      type: params.type,
      fileName: params.fileName,
      content: params.content,
      description: params.description,
      carouselId: params.carouselId,
      autoExecute: params.autoExecute ?? false,
      status: "pending",
      createdAt: now(),
      resolvedAt: null,
    };
    data.actions.push(action);
    prune(data);
  });
  return action;
}

export async function updateStagedAction(
  id: string,
  updates: Partial<Pick<StagedAction, "status" | "resolvedAt">>
): Promise<StagedAction | null> {
  let result: StagedAction | null = null;
  await updateData<StagedActionsData>(FILE, EMPTY, (data) => {
    const action = data.actions.find((a) => a.id === id);
    if (!action) return;
    if (updates.status) action.status = updates.status;
    if (updates.resolvedAt !== undefined) action.resolvedAt = updates.resolvedAt;
    result = action;
  });
  return result;
}

export async function updateStagedActionStatus(
  id: string,
  status: StagedActionStatus
): Promise<StagedAction | null> {
  return updateStagedAction(id, {
    status,
    resolvedAt: status !== "pending" ? now() : null,
  });
}
