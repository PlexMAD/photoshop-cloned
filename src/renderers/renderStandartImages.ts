import { MutableRefObject } from 'react';

export async function renderStandardImage(blob: Blob, canvasRef: MutableRefObject<HTMLCanvasElement | null>) {
  if (!canvasRef.current) return;

  const imageUrl = URL.createObjectURL(blob);
  const img = new Image();

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      try {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(imageUrl);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      console.error('Ошибка загрузки изображения');
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Ошибка загрузки изображения'));
    };

    img.src = imageUrl;
  });
}