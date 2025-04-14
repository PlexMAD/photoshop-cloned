import { MutableRefObject } from 'react';

export async function renderGB7(blob: Blob, canvasRef: MutableRefObject<HTMLCanvasElement | null>) {
  if (!canvasRef.current) return;

  try {
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);

    const flags = view.getUint8(5);
    const width = view.getUint16(6, false); 
    const height = view.getUint16(8, false);
    const hasMask = !!(flags & 0x01);

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    const pixels = new Uint8Array(buffer, 12); 

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const pixel = pixels[i];
        const gray = (pixel & 0x7F) << 1;
        const isTransparent = hasMask && (pixel & 0x80);

        const pos = (y * width + x) * 4;
        imageData.data[pos] = gray;     
        imageData.data[pos + 1] = gray; 
        imageData.data[pos + 2] = gray; 
        imageData.data[pos + 3] = isTransparent ? 0 : 255; 
      }
    }

    ctx.putImageData(imageData, 0, 0);
  } catch (error) {
    console.error('Ошибка декодирования GB7:', error);
    throw error;
  }
}