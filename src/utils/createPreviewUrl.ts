export const createPreviewUrl = (imageData: ImageData): string => {
  const canvas = document.createElement('canvas');
  const maxSize = 100;
  const scale = Math.min(maxSize / imageData.width, maxSize / imageData.height);
  canvas.width = imageData.width * scale;
  canvas.height = imageData.height * scale;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      ctx.scale(scale, scale);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }
  return canvas.toDataURL();
};