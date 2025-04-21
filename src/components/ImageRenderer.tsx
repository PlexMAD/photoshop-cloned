import { FC, useEffect, useRef, useState } from 'react';
import { renderGB7 } from '../utils/renderGB7';
import { renderStandardImage } from '../utils/renderStandartImages';
import { getColorDepth } from '../utils/getColorDepth';
import StatusBar from './StatusBar';

interface ImageRendererProps {
  image: Blob;
}

interface ImageInfo {
  width: number;
  height: number;
  colorDepth: string;
}

const ImageRenderer: FC<ImageRendererProps> = ({ image }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);

  useEffect(() => {
    const render = async () => {
      if (!image || !canvasRef.current) return;

      try {
        const isGB7 = image.type === 'application/gb7' ||
                     (image instanceof File && image.name.toLowerCase().endsWith('.gb7'));

        const imageData = isGB7
          ? await renderGB7(image)
          : await renderStandardImage(image);

        const canvas = canvasRef.current;
        canvas.width = imageData.width;
        canvas.height = imageData.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.putImageData(imageData, 0, 0);

        setImageInfo({
          width: imageData.width,
          height: imageData.height,
          colorDepth: getColorDepth(imageData, image.type),
        });
      } catch (error) {
        console.error('Ошибка при отрисовке:', error);
        setImageInfo(null);
      }
    };

    render();

    return () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setImageInfo(null);
    };
  }, [image]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          maxHeight: '80vh',
          display: 'block',
          backgroundColor: '#f0f0f0',
        }}
      />
      {imageInfo && (
        <StatusBar
          width={imageInfo.width}
          height={imageInfo.height}
          colorDepth={imageInfo.colorDepth}
        />
      )}
    </div>
  );
};

export default ImageRenderer;
