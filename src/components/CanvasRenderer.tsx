import React, { FC, useRef, useState, useEffect } from 'react';
import { Tool } from './ToolPanel';

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

    const scaledWidth = imageData.width * scale;
    const scaledHeight = imageData.height * scale;

    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = imageData.width;
    tmpCanvas.height = imageData.height;
    const tmpCtx = tmpCanvas.getContext('2d');
    if (!tmpCtx) return;

    tmpCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(
      tmpCanvas,
      0,
      0,
      imageData.width,
      imageData.height,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [imageData, canvasSize, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e: MouseEvent) => {
      if (activeTool !== 'eyedropper') return;

      const rect = canvas.getBoundingClientRect();
      const offsetX = (canvas.width - imageData.width * scale) / 2;
      const offsetY = (canvas.height - imageData.height * scale) / 2;

      const x = Math.floor((e.clientX - rect.left - offsetX) / scale);
      const y = Math.floor((e.clientY - rect.top - offsetY) / scale);

      if (
        x < 0 ||
        y < 0 ||
        x >= imageData.width ||
        y >= imageData.height
      ) {
        return;
      }
      console.log(x, y)

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
  }, [imageData, scale, activeTool, onColorPick]);

  return <canvas ref={canvasRef} className="canvas" />;
};

export default CanvasRenderer;
