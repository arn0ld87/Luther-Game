import { useRef, useState, useCallback, useEffect } from 'react';

interface DrawingSettings {
  color: string;
  size: number;
}

export const useCanvasDrawing = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  settings: DrawingSettings
) => {
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    setIsDrawing(true);
    draw(e);
  }, []);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  }, [canvasRef]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // Handle both React SyntheticEvent and native MouseEvent
    const clientX = 'clientX' in e ? e.clientX : (e as any).touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as any).touches[0].clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = settings.size;
    ctx.lineCap = 'round';
    ctx.strokeStyle = settings.color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [isDrawing, settings, canvasRef]);

  // Cleanup/Setup
  useEffect(() => {
     // Optional: Add event listeners for touch if needed, but for now mouse is fine.
  }, []);

  return {
    isDrawing,
    startDrawing,
    stopDrawing,
    draw
  };
};
