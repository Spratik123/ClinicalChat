import { create } from 'zustand';

/**
 * Client-only UI state. Anything that comes from the server belongs in
 * TanStack Query, not here. Anything that should be linkable (queue filters,
 * the highlighted finding on a turn) belongs in the URL, not here either —
 * see `src/features/queue/queueParams.ts`.
 *
 * What is left is state with no server truth and no shareable meaning: panel
 * open/closed, and toasts.
 */

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'success' | 'safety';
}

interface UiState {
  /** Raw-trace panel is collapsed by default; reviewers open it deliberately. */
  traceExpanded: boolean;
  setTraceExpanded: (expanded: boolean) => void;

  toasts: Toast[];
  pushToast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  traceExpanded: false,
  setTraceExpanded: (traceExpanded) => set({ traceExpanded }),

  toasts: [],
  pushToast: (message, tone = 'default') =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, tone }],
    })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
