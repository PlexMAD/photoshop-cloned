import { FC, useRef, useState, useEffect, useMemo } from 'react';
import { Tool } from './ToolPanel';
import { resizeImageData } from '../utils/imageResize';

interface Layer {
  id: 'first' | 'second';
  imageData: ImageData | null;
  info: { width: number; height: number; colorDepth: string } | null;
  blob: Blob | null;
  opacity: number;
  visible: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  alphaChannel: ImageData | null;
  alphaVisible: boolean;
}

interface CanvasRendererProps {
  layers: Layer[];
  scale: number;
  activeTool: Tool | null;
  activeLayerId: 'first' | 'second' | null;
  onColorPick?: (color: string, isSecondary: boolean, x: number, y: number) => void;
}

const CanvasRenderer: FC<CanvasRendererProps> = ({
  layers,
  scale,
  activeTool,
  activeLayerId,
  onColorPick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Масштабирование слоёв и альфа-каналов
  const rescaledLayers = useMemo(() => {
    return layers.map(layer => {
      if (!layer.imageData || !layer.visible) return { image: null, alpha: null };
      const image = resizeImageData(layer.imageData, {
        width: Math.max(1, Math.round(layer.imageData.width * scale)),
        height: Math.max(1, Math.round(layer.imageData.height * scale)),
        algorithm: 'bilinear',
      });
      const alpha = layer.alphaChannel && layer.alphaVisible
        ? resizeImageData(layer.alphaChannel, {
            width: Math.max(1, Math.round(layer.imageData.width * scale)),
            height: Math.max(1, Math.round(layer.imageData.height * scale)),
            algorithm: 'bilinear',
          })
        : null;
      return { image, alpha };
    });
  }, [layers, scale]);

  // Обновление размеров канваса
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

  // Рендеринг слоёв
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    layers.forEach((layer, index) => {
      if (!layer.visible || !layer.imageData || !rescaledLayers[index]?.image) return;

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = rescaledLayers[index]!.image!.width;
      tmpCanvas.height = rescaledLayers[index]!.image!.height;
      const tmpCtx = tmpCanvas.getContext('2d');
      if (!tmpCtx) return;

      tmpCtx.putImageData(rescaledLayers[index]!.image!, 0, 0);

      // Применение альфа-канала
      if (layer.alphaChannel && layer.alphaVisible && rescaledLayers[index]?.alpha) {
        const alphaCanvas = document.createElement('canvas');
        alphaCanvas.width = tmpCanvas.width;
        alphaCanvas.height = tmpCanvas.height;
        const alphaCtx = alphaCanvas.getContext('2d');
        if (alphaCtx) {
          alphaCtx.putImageData(rescaledLayers[index]!.alpha!, 0, 0);
          tmpCtx.globalCompositeOperation = 'destination-in';
          tmpCtx.drawImage(alphaCanvas, 0, 0);
        }
      }

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
      ctx.drawImage(tmpCanvas, offset.x, offset.y);
      ctx.restore();
    });

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [layers, rescaledLayers, canvasSize, offset]);

  // Центрирование
  useEffect(() => {
    if (offset.x !== 0 && offset.y !== 0) return;
    if (!canvasSize.width || !canvasSize.height) return;

    const scaledWidth = Math.max(
      ...layers.map(layer => (layer.info?.width || 0) * scale)
    );
    const scaledHeight = Math.max(
      ...layers.map(layer => (layer.info?.height || 0) * scale)
    );

    if (scaledWidth === 0 || scaledHeight === 0) return;

    const centerX = (canvasSize.width - scaledWidth) / 2;
    const centerY = (canvasSize.height - scaledHeight) / 2;

    setOffset({ x: centerX, y: centerY });
  }, [canvasSize, layers, scale]);

  // Обработка клика для пипетки
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e: MouseEvent) => {
      if (activeTool !== 'eyedropper' || !activeLayerId) return;

      const activeLayer = layers.find(layer => layer.id === activeLayerId);
      if (!activeLayer || !activeLayer.imageData || !activeLayer.visible) return;

      const rect = canvas.getBoundingClientRect();
      const scaledWidth = activeLayer.imageData.width * scale;
      const scaledHeight = activeLayer.imageData.height * scale;
      const x = Math.floor(
        (e.clientX - rect.left - offset.x) * (activeLayer.imageData.width / scaledWidth)
      );
      const y = Math.floor(
        (e.clientY - rect.top - offset.y) * (activeLayer.imageData.height / scaledHeight)
      );

      if (x < 0 || y < 0 || x >= activeLayer.imageData.width || y >= activeLayer.imageData.height) {
        return;
      }

      const index = (y * activeLayer.imageData.width + x) * 4;
      const [r, g, b] = [
        activeLayer.imageData.data[index],
        activeLayer.imageData.data[index + 1],
        activeLayer.imageData.data[index + 2],
      ];

      const color = `rgb(${r}, ${g}, ${b})`;
      const isSecondary = e.altKey || e.ctrlKey || e.shiftKey;

      onColorPick?.(color, isSecondary, x, y);
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [layers, activeLayerId, activeTool, onColorPick, offset, scale]);

  // Обработка перетаскивания (hand tool)
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

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
      style={{ cursor: activeTool === 'hand' ? 'grab' : 'default' }}
    />
  );
};

export default CanvasRenderer;