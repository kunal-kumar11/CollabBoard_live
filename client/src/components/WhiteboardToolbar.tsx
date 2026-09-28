import type { MutableRefObject } from "react";
import { fabric } from "fabric";

type Tool =
  | "pen"
  | "line"
  | "rectangle"
  | "circle";

type WhiteboardToolbarProps = {
  isAdmin: boolean;

  currentTool: Tool;
  brushColor: string;
  brushSize: number;
  backgroundColor: string;

  canUndo: boolean;
  canRedo: boolean;

  fabricCanvasRef: MutableRefObject<fabric.Canvas | null>;

  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  onSaveDrawing: () => void;

  onToolChange: (tool: Tool) => void;
  onBrushColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onBackgroundColorChange: (color: string) => void;
};

function WhiteboardToolbar({
  isAdmin,
  currentTool,
  brushColor,
  brushSize,
  backgroundColor,
  canUndo,
  canRedo,
  fabricCanvasRef,
  onClear,
  onUndo,
  onRedo,
  onDownload,
  onSaveDrawing,
  onToolChange,
  onBrushColorChange,
  onBrushSizeChange,
  onBackgroundColorChange,
}: WhiteboardToolbarProps) {

  const handleBrushColorChange = (
    color: string
  ) => {
    onBrushColorChange(color);

    const canvas = fabricCanvasRef.current;

    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
    }
  };

  const handleBrushSizeChange = (
    size: number
  ) => {
    onBrushSizeChange(size);

    const canvas = fabricCanvasRef.current;

    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = size;
    }
  };

  const handleBackgroundColorChange = (
    color: string
  ) => {
    onBackgroundColorChange(color);
  };

  const handleToolChange = (
    tool: Tool
  ) => {
    onToolChange(tool);

    const canvas = fabricCanvasRef.current;

    if (canvas) {
      canvas.isDrawingMode =
        tool === "pen";
    }
  };

  return (
    <div id="toolbar">

      {/* CLEAR */}
      <button
        id="clearBtn"
        style={{
          display: isAdmin
            ? "block"
            : "none",
        }}
        onClick={onClear}
      >
        🗑️ Clear
      </button>

      {/* UNDO */}
      <button
        id="undoBtn"
        style={{
          display: isAdmin
            ? "block"
            : "none",
        }}
        disabled={!canUndo}
        onClick={onUndo}
      >
        ↩️ Undo
      </button>

      {/* REDO */}
      <button
        id="redoBtn"
        style={{
          display: isAdmin
            ? "block"
            : "none",
        }}
        disabled={!canRedo}
        onClick={onRedo}
      >
        🔁 Redo
      </button>

      {/* BRUSH COLOR */}
      <label htmlFor="colorPicker">
        Brush Color
      </label>

      <input
        type="color"
        id="colorPicker"
        value={brushColor}
        onChange={(e) =>
          handleBrushColorChange(
            e.target.value
          )
        }
      />

      {/* BRUSH SIZE */}
      <label htmlFor="brushSize">
        Brush Size
      </label>

      <input
        type="range"
        id="brushSize"
        min="1"
        max="20"
        value={brushSize}
        onChange={(e) =>
          handleBrushSizeChange(
            Number(e.target.value)
          )
        }
      />

      {/* BACKGROUND COLOR */}
      <label htmlFor="bgColorPicker">
        Canvas Background
      </label>

      <input
        type="color"
        id="bgColorPicker"
        title="Background Color"
        value={backgroundColor}
        onChange={(e) =>
          handleBackgroundColorChange(
            e.target.value
          )
        }
      />

      {/* TOOL SELECTOR */}
      <select
        id="toolSelector"
        value={currentTool}
        onChange={(e) =>
          handleToolChange(
            e.target.value as Tool
          )
        }
      >
        <option value="pen">
          Pen
        </option>

        <option value="line">
          Line
        </option>

        <option value="rectangle">
          Rectangle
        </option>

        <option value="circle">
          Circle
        </option>
      </select>

      {/* DOWNLOAD */}
      <button
        id="downloadBtn"
        onClick={onDownload}
      >
        📥 Download
      </button>

      {/* SAVE */}
      <button
        id="saveBtn"
        onClick={onSaveDrawing}
      >
        💾 Save
      </button>

    </div>
  );
}

export default WhiteboardToolbar;