import { useRef } from "react";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  function getContext() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function toCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = getContext();

    if (!context) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    const { x, y } = toCanvasPoint(event);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
    context.beginPath();
    context.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = getContext();

    if (!isDrawingRef.current || !context) {
      return;
    }

    const { x, y } = toCanvasPoint(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function handlePointerUp() {
    isDrawingRef.current = false;
  }

  function handleClear() {
    getContext()?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        className="drawing-canvas__surface"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="Drawing canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="button-row button-row--compact">
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear canvas
        </button>
      </div>
    </div>
  );
}
