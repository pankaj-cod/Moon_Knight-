import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 50;

/**
 * useHistory — wraps a state value with undo/redo support.
 *
 * History entries are committed with a 600ms debounce so that rapid
 * slider drags are collapsed into a single history step instead of
 * flooding the stack with intermediate values.
 *
 * Usage:
 *   const { adjustments, setAdjustments, undo, redo, canUndo, canRedo } = useHistory(initial);
 */
export function useHistory(initialState) {
    const [historyState, setHistoryState] = useState({
        past: [],       // array of previous states (oldest → newest)
        present: initialState,
        future: [],     // array of undone states (newest → oldest)
    });

    // Timer ref for debounced history commits
    const debounceTimer = useRef(null);
    // Holds the snapshot taken BEFORE a drag sequence begins
    const stagedPresent = useRef(null);

    /**
     * setAdjustments — updates the present value immediately (live preview)
     * and schedules a history commit 600ms after the last call.
     */
    const setAdjustments = useCallback((newStateOrUpdater) => {
        setHistoryState((hs) => {
            const newPresent =
                typeof newStateOrUpdater === "function"
                    ? newStateOrUpdater(hs.present)
                    : newStateOrUpdater;

            // Capture the "before" snapshot only at the start of a drag
            if (stagedPresent.current === null) {
                stagedPresent.current = hs.present;
            }

            // Debounce: commit snapshot to history after inactivity
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                if (stagedPresent.current !== null) {
                    setHistoryState((prev) => ({
                        past: [
                            ...prev.past.slice(-(MAX_HISTORY - 1)),
                            stagedPresent.current,
                        ],
                        present: prev.present,
                        future: [], // new action clears redo
                    }));
                    stagedPresent.current = null;
                }
            }, 600);

            return { ...hs, present: newPresent };
        });
    }, []);

    /** undo — restores the most recent past state */
    const undo = useCallback(() => {
        // Flush any pending debounced commit first
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        stagedPresent.current = null;

        setHistoryState((hs) => {
            if (hs.past.length === 0) return hs;
            const previous = hs.past[hs.past.length - 1];
            return {
                past: hs.past.slice(0, -1),
                present: previous,
                future: [hs.present, ...hs.future].slice(0, MAX_HISTORY),
            };
        });
    }, []);

    /** redo — re-applies the most recently undone state */
    const redo = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        stagedPresent.current = null;

        setHistoryState((hs) => {
            if (hs.future.length === 0) return hs;
            const next = hs.future[0];
            return {
                past: [...hs.past, hs.present].slice(-MAX_HISTORY),
                present: next,
                future: hs.future.slice(1),
            };
        });
    }, []);

    return {
        adjustments: historyState.present,
        setAdjustments,
        undo,
        redo,
        canUndo: historyState.past.length > 0,
        canRedo: historyState.future.length > 0,
        historyLength: historyState.past.length,
    };
}
