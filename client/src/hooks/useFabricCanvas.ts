import { useEffect } from "react";

import type {
  MutableRefObject,
  RefObject,
} from "react";

import { fabric } from "fabric";

type UseFabricCanvasProps = {
  canvasRef: RefObject<
    HTMLCanvasElement | null
  >;

  fabricCanvasRef: MutableRefObject<
    fabric.Canvas | null
  >;

  currentToolRef: MutableRefObject<
    | "pen"
    | "line"
    | "rectangle"
    | "circle"
  >;

  brushColorRef: MutableRefObject<string>;

  brushSizeRef: MutableRefObject<number>;

  backgroundColorRef: MutableRefObject<string>;

  saveState: () => void;

  emitCanvas: () => void;

  // =============================
  // NEW
  // =============================

  isCanvasReadyRef: MutableRefObject<boolean>;
};

function useFabricCanvas({
  canvasRef,
  fabricCanvasRef,
  currentToolRef,
  brushColorRef,
  brushSizeRef,
  backgroundColorRef,
  saveState,
  emitCanvas,
  isCanvasReadyRef,
}: UseFabricCanvasProps) {
  useEffect(() => {
    const canvasElement =
      canvasRef.current;

    if (!canvasElement) {
      return;
    }

    // =============================
    // CREATE FABRIC CANVAS
    // =============================

    const canvas =
      new fabric.Canvas(
        canvasElement,
        {
          isDrawingMode: true,
          backgroundColor:
            "#ffffff",
        }
      );

    fabricCanvasRef.current =
      canvas;

    // =============================
    // INITIAL CANVAS SETUP
    // =============================

    canvas.setHeight(
      window.innerHeight - 100
    );

    canvas.setWidth(
      window.innerWidth - 200
    );

    canvas.freeDrawingBrush.width =
      brushSizeRef.current;

    canvas.freeDrawingBrush.color =
      brushColorRef.current;

    canvas.setBackgroundColor(
      backgroundColorRef.current,
      canvas.renderAll.bind(canvas)
    );

    // =============================
    // IMPORTANT
    // =============================
    //
    // The canvas is NOT ready yet.
    //
    // useSocket will receive the
    // current room canvas and then
    // mark it as ready.
    //
    // Therefore we do NOT allow
    // drawing until synchronization
    // has completed.
    // =============================

    isCanvasReadyRef.current =
      false;

    // Save initial local state.
    // This is later replaced by the
    // synchronized state in useSocket.
    saveState();

    // =============================
    // DRAWING STATE
    // =============================

    let startX = 0;
    let startY = 0;

    let isDrawing = false;

    let tempShape:
      | fabric.Object
      | null = null;

    // =============================
    // MOUSE DOWN
    // =============================

    const handleMouseDown = (
      event: fabric.IEvent
    ) => {
      // Do not allow drawing until
      // the current room state has
      // been synchronized.
      if (
        !isCanvasReadyRef.current
      ) {
        return;
      }

      const tool =
        currentToolRef.current;

      // Pen drawing is handled
      // automatically by Fabric.
      if (tool === "pen") {
        return;
      }

      if (
        tool !== "line" &&
        tool !== "rectangle" &&
        tool !== "circle"
      ) {
        return;
      }

      const pointer =
        canvas.getPointer(event.e);

      startX = pointer.x;
      startY = pointer.y;

      isDrawing = true;

      const options = {
        stroke:
          brushColorRef.current,

        strokeWidth:
          brushSizeRef.current,

        fill: "transparent",

        selectable: false,
      };

      // =============================
      // LINE
      // =============================

      if (tool === "line") {
        tempShape =
          new fabric.Line(
            [
              startX,
              startY,
              startX,
              startY,
            ],
            {
              ...options,

              left: startX,
              top: startY,
            }
          );
      }

      // =============================
      // RECTANGLE
      // =============================

      else if (
        tool === "rectangle"
      ) {
        tempShape =
          new fabric.Rect({
            left: startX,
            top: startY,

            width: 0,
            height: 0,

            ...options,
          });
      }

      // =============================
      // ELLIPSE
      // =============================

      else if (
        tool === "circle"
      ) {
        tempShape =
          new fabric.Ellipse({
            rx: 0,
            ry: 0,

            originX: "center",
            originY: "center",

            left: startX,
            top: startY,

            ...options,
          });
      }

      if (tempShape) {
        canvas.add(tempShape);
      }
    };

    // =============================
    // MOUSE MOVE
    // =============================

    const handleMouseMove = (
      event: fabric.IEvent
    ) => {
      if (
        !isCanvasReadyRef.current
      ) {
        return;
      }

      if (
        !isDrawing ||
        !tempShape
      ) {
        return;
      }

      const pointer =
        canvas.getPointer(event.e);

      const dx =
        pointer.x - startX;

      const dy =
        pointer.y - startY;

      const tool =
        currentToolRef.current;

      // =============================
      // LINE
      // =============================

      if (tool === "line") {
        const line =
          tempShape as fabric.Line;

        line.set({
          x2: pointer.x,
          y2: pointer.y,
        });
      }

      // =============================
      // RECTANGLE
      // =============================

      else if (
        tool === "rectangle"
      ) {
        const rectangle =
          tempShape as fabric.Rect;

        rectangle.set({
          width: Math.abs(dx),

          height:
            Math.abs(dy),

          left:
            dx < 0
              ? pointer.x
              : startX,

          top:
            dy < 0
              ? pointer.y
              : startY,
        });
      }

      // =============================
      // ELLIPSE
      // =============================

      else if (
        tool === "circle"
      ) {
        const ellipse =
          tempShape as fabric.Ellipse;

        ellipse.set({
          rx:
            Math.abs(dx) / 2,

          ry:
            Math.abs(dy) / 2,

          left:
            startX + dx / 2,

          top:
            startY + dy / 2,
        });
      }

      canvas.renderAll();
    };

    // =============================
    // MOUSE UP
    // =============================

    const handleMouseUp = () => {
      if (
        !isCanvasReadyRef.current
      ) {
        return;
      }

      if (tempShape) {
        saveState();
        emitCanvas();
      }

      isDrawing = false;

      tempShape = null;
    };

    // =============================
    // FREE DRAWING
    // =============================

    const handlePathCreated = () => {
      if (
        !isCanvasReadyRef.current
      ) {
        return;
      }

      saveState();
      emitCanvas();
    };

    // =============================
    // OBJECT ADDED
    // =============================

    const handleObjectAdded = () => {
      if (
        !isCanvasReadyRef.current
      ) {
        return;
      }

      saveState();
    };

    // =============================
    // OBJECT MODIFIED
    // =============================

    const handleObjectModified = () => {
      if (
        !isCanvasReadyRef.current
      ) {
        return;
      }

      saveState();
    };

    // =============================
    // RESIZE CANVAS
    // =============================

    const resizeCanvas = () => {
      const leftSidebar =
        document.getElementById(
          "userSection"
        );

      const rightSidebar =
        document.getElementById(
          "savedDrawings"
        );

      const toolbar =
        document.getElementById(
          "toolbar"
        );

      const sidebarWidth =
        (leftSidebar?.offsetWidth ||
          0) +
        (rightSidebar?.offsetWidth ||
          0);

      const availableWidth =
        window.innerWidth -
        sidebarWidth -
        40;

      const toolbarHeight =
        toolbar?.offsetHeight ||
        0;

      const availableHeight =
        window.innerHeight -
        toolbarHeight -
        150;

      canvas.setWidth(
        availableWidth
      );

      canvas.setHeight(
        availableHeight
      );

      canvas.renderAll();
    };

    resizeCanvas();

    // =============================
    // REGISTER EVENTS
    // =============================

    canvas.on(
      "mouse:down",
      handleMouseDown
    );

    canvas.on(
      "mouse:move",
      handleMouseMove
    );

    canvas.on(
      "mouse:up",
      handleMouseUp
    );

    canvas.on(
      "path:created",
      handlePathCreated
    );

    canvas.on(
      "object:added",
      handleObjectAdded
    );

    canvas.on(
      "object:modified",
      handleObjectModified
    );

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    // =============================
    // CLEANUP
    // =============================

    return () => {
      canvas.off(
        "mouse:down",
        handleMouseDown
      );

      canvas.off(
        "mouse:move",
        handleMouseMove
      );

      canvas.off(
        "mouse:up",
        handleMouseUp
      );

      canvas.off(
        "path:created",
        handlePathCreated
      );

      canvas.off(
        "object:added",
        handleObjectAdded
      );

      canvas.off(
        "object:modified",
        handleObjectModified
      );

      window.removeEventListener(
        "resize",
        resizeCanvas
      );

      canvas.dispose();

      fabricCanvasRef.current =
        null;

      isCanvasReadyRef.current =
        false;
    };
  }, []);
}

export default useFabricCanvas;