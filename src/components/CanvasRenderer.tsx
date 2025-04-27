import { FC, useRef, useEffect, useState } from 'react';

interface CanvasRendererProps {
  imageData: ImageData;
}

const CanvasRenderer: FC<CanvasRendererProps> = ({ imageData }) => {
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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(
      canvas.width / imageData.width,
      canvas.height / imageData.height
    );

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

    ctx.drawImage(tmpCanvas, 0, 0, imageData.width, imageData.height, offsetX, offsetY, scaledWidth, scaledHeight);

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [imageData, canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      className='canvas'
    />
  );
};

export default CanvasRenderer;
