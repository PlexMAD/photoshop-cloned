export async function renderGB7(blob: Blob): Promise<ImageData> {
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);

  const flags = view.getUint8(5);
  const width = view.getUint16(6, false);
  const height = view.getUint16(8, false);
  const hasMask = !!(flags & 0x01);

  const pixels = new Uint8Array(buffer, 12);
  const imageData = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const pixel = pixels[i];
      const gray = (pixel & 0x7F) << 1;
      const isTransparent = hasMask && !(pixel & 0x80);

      const pos = (y * width + x) * 4;
      imageData.data[pos] = gray;
      imageData.data[pos + 1] = gray;
      imageData.data[pos + 2] = gray;
      imageData.data[pos + 3] = isTransparent ? 0 : 255;
    }
  }

  return imageData;
}
