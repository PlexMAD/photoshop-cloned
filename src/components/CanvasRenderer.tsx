import { FC, useRef, useState, useEffect, useMemo } from 'react';
import { Tool } from './ToolPanel';
import { resizeImageData } from '../utils/imageResize';

interface CanvasRendererProps {
  imageData: ImageData;
  scale: number;
  activeTool: Tool | null;
  onColorPick?: (color: string, isSecondary: boolean, x: number, y: number) => void;
}

const CanvasRenderer: FC<CanvasRendererProps> = ({
  imageData,
  scale,
  activeTool,
  onColorPick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const rescaledImageData = useMemo(() => {
    return resizeImageData(imageData, {
      width: Math.max(1, Math.round(imageData.width * scale)),
      height: Math.max(1, Math.round(imageData.height * scale)),
      algorithm: 'bilinear',
    });
  }, [imageData, scale]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const padding = 50;
      setCanvasSize({
        width: window.innerWidth - padding * 2,
        height: window.innerHeight - padding * 2,
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaledWidth = rescaledImageData.width;
    const scaledHeight = rescaledImageData.height;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = scaledWidth;
    tmpCanvas.height = scaledHeight;
    const tmpCtx = tmpCanvas.getContext('2d');
    if (!tmpCtx) return;

    tmpCtx.putImageData(rescaledImageData, 0, 0);

    ctx.drawImage(tmpCanvas, offset.x, offset.y);

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [rescaledImageData, canvasSize, offset]);

  useEffect(() => {
    if (offset.x !== 0 && offset.y !== 0) return;
    if (!canvasSize.width || !canvasSize.height) return;

    const scaledWidth = Math.max(1, Math.round(imageData.width * scale));
    const scaledHeight = Math.max(1, Math.round(imageData.height * scale));

    const centerX = (canvasSize.width - scaledWidth) / 2;
    const centerY = (canvasSize.height - scaledHeight) / 2;

    setOffset({ x: centerX, y: centerY });
  }, [canvasSize, imageData, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e: MouseEvent) => {
      if (activeTool !== 'eyedropper') return;

      const rect = canvas.getBoundingClientRect();
      const scaledWidth = Math.max(1, Math.round(imageData.width * scale));
      const scaledHeight = Math.max(1, Math.round(imageData.height * scale));
      const x = Math.floor((e.clientX - rect.left - offset.x) * (imageData.width / scaledWidth));
      const y = Math.floor((e.clientY - rect.top - offset.y) * (imageData.height / scaledHeight));

      if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
        return;
      }

      const index = (y * imageData.width + x) * 4;
      const [r, g, b] = [
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
      ];

      const color = `rgb(${r}, ${g}, ${b})`;
      const isSecondary = e.altKey || e.ctrlKey || e.shiftKey;

      onColorPick?.(color, isSecondary, x, y);
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [imageData, scale, activeTool, onColorPick, offset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (activeTool !== 'hand') return;
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (activeTool !== 'hand' || !dragStart) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      if (activeTool !== 'hand') return;
      setDragStart(null);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeTool, dragStart]);

  return <canvas ref={canvasRef} className="canvas" style={{ cursor: activeTool === 'hand' ? 'grab' : 'default' }} />;
};

export default CanvasRenderer;