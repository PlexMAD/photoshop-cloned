export const getColorDepth = (imageData: ImageData, mimeType: string): string => {
  const totalPixels = imageData.width * imageData.height;
  const data = imageData.data;
  const channels = data.length / totalPixels;
  const bitsPerChannel = 8;
  const totalBitsPerPixel = bitsPerChannel * channels;

  const isGrayscale = (() => {
    if (channels < 3) return false;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) {
        return false;
      }
    }
    return true;
  })();

  if (isGrayscale) {
    return '8-bit grayscale';
  }

  if (mimeType === 'image/jpeg') {
    return '24-bit RGB (8×3)';
  }

  if (mimeType === 'image/png') {
    if (channels === 4) return '32-bit RGBA (8×4)';
    if (channels === 3) return '24-bit RGB (8×3)';
  }

  return `${totalBitsPerPixel}-bit (${bitsPerChannel}×${channels}, неопределено)`;
};
