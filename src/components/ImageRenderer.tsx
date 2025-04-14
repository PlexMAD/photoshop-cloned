import React, { FC, useEffect, useRef } from 'react';
import { renderGB7 } from '../renderers/renderGB7'
import { renderStandardImage } from '../renderers/renderStandartImages';

interface ImageRendererProps {
  image: Blob;
}

const ImageRenderer: FC<ImageRendererProps> = ({ image }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const render = async () => {
      if (!image) return;
      
      try {
        const isGB7 = image.type === 'application/gb7' || 
                     (image instanceof File && image.name.toLowerCase().endsWith('.gb7'));

        if (isGB7) {
          await renderGB7(image, canvasRef);
        } else {
          await renderStandardImage(image, canvasRef);
        }
      } catch (error) {
        console.error('Ошибка при отрисовке:', error);
      }
    };

    render();

    return () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  }, [image]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        maxHeight: '80vh',
        display: 'block',
        backgroundColor: '#f0f0f0'
      }} 
    />
  );
};

export default ImageRenderer;