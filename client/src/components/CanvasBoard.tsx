import type { RefObject } from "react";

type CanvasBoardProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

function CanvasBoard({
  canvasRef,
}: CanvasBoardProps) {
  return (
    <div
      id="canvasWrapper"
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <canvas
        id="canvas"
        ref={canvasRef}
      />

      <div
        id="cursorLayer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 100,
        }}
      />
    </div>
  );
}

export default CanvasBoard;