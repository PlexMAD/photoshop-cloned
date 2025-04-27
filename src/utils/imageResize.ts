import { resizeNearestNeighbor, resizeBilinear } from './resizeAlghoritms';

export type ImageDataResizeOptions = {
  width: number;
  height: number;
  algorithm: 'nearest' | 'bilinear';
};

export function resizeImageData(imageData: ImageData, options: ImageDataResizeOptions): ImageData {
  if (options.algorithm === 'nearest') {
    return resizeNearestNeighbor(imageData, options.width, options.height);
  } else {
    return resizeBilinear(imageData, options.width, options.height);
  }
}
