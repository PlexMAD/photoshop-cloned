export const getColorDepth = (imageData: ImageData, mimeType: string): string => {
  const data = imageData.data;
  const bitsPerChannel = 8;

  let hasTransparency = false;
  let isGrayscale = true;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 255) hasTransparency = true;
    if (r !== g || r !== b) isGrayscale = false;

    if (hasTransparency && !isGrayscale) break;
  }

  if (isGrayscale) {
    return hasTransparency ? '8-bit grayscale + alpha' : '8-bit grayscale';
  }

  if (mimeType === 'image/jpeg') {
    return '24-bit RGB (8×3)';
  }

  if (mimeType === 'image/png') {
    if (hasTransparency) return '32-bit RGBA (8×4)';
    return '24-bit RGB (8×3)';
  }

  const channels = hasTransparency ? 4 : 3;
  const totalBitsPerPixel = bitsPerChannel * channels;

  return `${totalBitsPerPixel}-bit (${bitsPerChannel}×${channels}, неопределено)`;
};
