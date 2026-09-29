import { useRef, useState } from "react";
import { fabric } from "fabric";

type DrawingState = {
  objects: any[];
};

type UseUndoRedoProps = {
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
  isAdmin: boolean;
  emitCanvas: () => void;
};

function useUndoRedo({
  fabricCanvasRef,
  isAdmin,
  emitCanvas,
}: UseUndoRedoProps) {
  const [canUndo, setCanUndo] =
    useState(false);

  const [canRedo, setCanRedo] =
    useState(false);

  const stateStackRef =
    useRef<DrawingState[]>([]);

  const redoStackRef =
    useRef<DrawingState[]>([]);

  const isRestoringRef =
    useRef(false);

  // =========================
  // UPDATE BUTTONS
  // =========================

  const updateUndoRedoButtons = () => {
    setCanUndo(
      stateStackRef.current.length >= 2
    );

    setCanRedo(
      redoStackRef.current.length > 0
    );
  };

  // =========================
  // CREATE DRAWING STATE
  // =========================

  const getDrawingState = (
    canvas: fabric.Canvas
  ): DrawingState => {
    const canvasJSON =
      canvas.toJSON();

    return {
      // IMPORTANT:
      // Only objects are stored.
      // Background is intentionally excluded.
      objects:
        canvasJSON.objects || [],
    };
  };

  // =========================
  // COMPARE DRAWING STATES
  // =========================

  const areDrawingStatesEqual = (
    first: DrawingState | undefined,
    second: DrawingState | undefined
  ) => {
    if (!first || !second) {
      return false;
    }

    return (
      JSON.stringify(first.objects) ===
      JSON.stringify(second.objects)
    );
  };

  // =========================
  // SAVE DRAWING STATE
  // =========================

  const saveState = () => {
    if (isRestoringRef.current) {
      return;
    }

    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    const drawingState =
      getDrawingState(canvas);

    const lastState =
      stateStackRef.current[
        stateStackRef.current.length - 1
      ];

    /*
     * IMPORTANT:
     *
     * If only the background changed,
     * the objects are identical.
     *
     * Therefore do NOT create another
     * undo/redo history entry.
     *
     * This is important because
     * Whiteboard.tsx currently calls
     * saveState() after background changes.
     */
    if (
      areDrawingStatesEqual(
        lastState,
        drawingState
      )
    ) {
      return;
    }

    stateStackRef.current.push(
      drawingState
    );

    // Keep maximum 50 history states
    if (
      stateStackRef.current.length > 50
    ) {
      stateStackRef.current.shift();
    }

    // New drawing operation clears redo
    redoStackRef.current = [];

    updateUndoRedoButtons();
  };

  // =========================
  // RESTORE DRAWING STATE
  // =========================

  const restoreDrawingState = (
    drawingState: DrawingState
  ) => {
    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    /*
     * Background is NOT part of history.
     *
     * Therefore remember the current
     * background before loading objects.
     */
    const currentBackground =
      canvas.backgroundColor;

    canvas.loadFromJSON(
      {
        objects:
          drawingState.objects,
      },
      () => {
        /*
         * Restore the current background
         * after loading the drawing objects.
         */
        canvas.setBackgroundColor(
          currentBackground as string,
          () => {
            canvas.renderAll();

            emitCanvas();

            isRestoringRef.current =
              false;

            updateUndoRedoButtons();
          }
        );
      }
    );
  };

  // =========================
  // UNDO
  // =========================

  const handleUndo = () => {
    if (
      !isAdmin ||
      stateStackRef.current.length < 2
    ) {
      return;
    }

    const canvas =
      fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    isRestoringRef.current = true;

    // Remove current drawing state
    const currentState =
      stateStackRef.current.pop();

    if (currentState) {
      redoStackRef.current.push(
        currentState
      );
    }

    // Get previous drawing state
    const previousState =
      stateStackRef.current[
        stateStackRef.current.length - 1
      ];

    restoreDrawingState(
      previousState
    );
  };

  // =========================
  // REDO
  // =========================

  const handleRedo = () => {
    if (
      !isAdmin ||
      redoStackRef.current.length === 0
    ) {
      return;
    }

    const nextState =
      redoStackRef.current.pop();

    if (!nextState) {
      return;
    }

    isRestoringRef.current = true;

    stateStackRef.current.push(
      nextState
    );

    restoreDrawingState(
      nextState
    );
  };

  return {
    canUndo,
    canRedo,

    stateStackRef,
    redoStackRef,

    isRestoringRef,

    saveState,

    handleUndo,
    handleRedo,

    updateUndoRedoButtons,
  };
}

export default useUndoRedo;