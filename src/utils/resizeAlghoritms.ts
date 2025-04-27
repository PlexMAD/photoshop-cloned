export function resizeNearestNeighbor(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const output = new ImageData(newWidth, newHeight);
    const src = imageData.data;
    const dst = output.data;
    const xRatio = imageData.width / newWidth;
    const yRatio = imageData.height / newHeight;
  
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.min(Math.round(x * xRatio), imageData.width - 1);
        const srcY = Math.min(Math.round(y * yRatio), imageData.height - 1);
        const srcIndex = (srcY * imageData.width + srcX) * 4;
        const dstIndex = (y * newWidth + x) * 4;
  
        dst[dstIndex] = src[srcIndex];
        dst[dstIndex + 1] = src[srcIndex + 1];
        dst[dstIndex + 2] = src[srcIndex + 2];
        dst[dstIndex + 3] = src[srcIndex + 3];
      }
    }
  
    return output;
  }
  
  export function resizeBilinear(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const output = new ImageData(newWidth, newHeight);
    const src = imageData.data;
    const dst = output.data;
  
    const w = imageData.width;
    const h = imageData.height;
    const xRatio = w / newWidth;
    const yRatio = h / newHeight;
  
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const gx = x * xRatio;
        const gy = y * yRatio;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const x1 = Math.min(x0 + 1, w - 1);
        const y1 = Math.min(y0 + 1, h - 1);
        const dx = gx - x0;
        const dy = gy - y0;
  
        for (let c = 0; c < 4; c++) {
          const i00 = (y0 * w + x0) * 4 + c;
          const i10 = (y0 * w + x1) * 4 + c;
          const i01 = (y1 * w + x0) * 4 + c;
          const i11 = (y1 * w + x1) * 4 + c;
  
          const top = src[i00] * (1 - dx) + src[i10] * dx;
          const bottom = src[i01] * (1 - dx) + src[i11] * dx;
          dst[(y * newWidth + x) * 4 + c] = top * (1 - dy) + bottom * dy;
        }
      }
    }
  
    return output;
  }
  