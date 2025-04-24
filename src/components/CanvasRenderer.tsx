import { FC, useRef, useEffect } from 'react';

interface CanvasRendererProps {
  imageData: ImageData;
}

const CanvasRenderer: FC<CanvasRendererProps> = ({ imageData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(imageData, 0, 0);

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [imageData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxHeight: '80vh',
        display: 'block',
        backgroundImage: `
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    />
  );
};

export default CanvasRenderer;
