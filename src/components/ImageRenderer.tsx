import React, { FC, useEffect, useState } from 'react';
import { Button } from 'antd';
import { renderGB7 } from '../utils/renderGB7';
import { renderStandartImage } from '../utils/renderStandartImage';
import { getColorDepth } from '../utils/getColorDepth';
import StatusBar from './StatusBar';
import CanvasRenderer from './CanvasRenderer';
import { resizeImageData, ImageDataResizeOptions } from '../utils/imageResize';
import ImageResizerModal from './ImageResizerModal';
import ScaleSelector from './ScaleSelector';
import ToolPanel, { Tool } from './ToolPanel';
import EyeDropperInfo from './EyeDropperInfo';
import LayerSelector from './LayerSelector';
import CurvesModal from './CurvesModal';
import SaveImageSelector from './SaveImageSelector';
import KernelFilterModal from './KernelFilterModal' 

interface ImageRendererProps {
  image: Blob;
}

interface ImageInfo {
  width: number;
  height: number;
  colorDepth: string;
  hasAlpha: boolean;
}

export interface Layer {
  id: 'first' | 'second';
  imageData: ImageData | null;
  info: ImageInfo | null;
  blob: Blob | null;
  opacity: number;
  visible: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  showAlphaOnly: boolean;
}

const ImageRenderer: FC<ImageRendererProps> = ({ image }) => {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'first',
      imageData: null,
      info: null,
      blob: null,
      opacity: 1,
      visible: true,
      blendMode: 'normal',
      showAlphaOnly: false,
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<'first' | 'second' | null>('first');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCurvesModalVisible, setIsCurvesModalVisible] = useState(false);
  const [isKernelModalVisible, setIsKernelModalVisible] = useState(false); // Состояние для модалки фильтра
  const [scalePercent, setScalePercent] = useState(100);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [primaryX, setPrimaryX] = useState<number | null>(null);
  const [primaryY, setPrimaryY] = useState<number | null>(null);
  const [secondaryX, setSecondaryX] = useState<number | null>(null);
  const [secondaryY, setSecondaryY] = useState<number | null>(null);

  useEffect(() => {
    const render = async () => {
      if (!image) return;

      try {
        const isGB7 =
          image.type === 'application/gb7' ||
          (image instanceof File && image.name.toLowerCase().endsWith('.gb7'));

        const data = isGB7
          ? await renderGB7(image)
          : await renderStandartImage(image);

        let hasAlpha = false;
        for (let i = 3; i < data.data.length; i += 4) {
          if (data.data[i] < 255) {
            hasAlpha = true;
            break;
          }
        }

        setLayers([
          {
            id: 'first',
            imageData: data,
            info: {
              width: data.width,
              height: data.height,
              colorDepth: getColorDepth(data, image.type),
              hasAlpha,
            },
            blob: image,
            opacity: 1,
            visible: true,
            blendMode: 'normal',
            showAlphaOnly: false,
          },
        ]);
        setActiveLayerId('first');
        setScalePercent(
          Math.min(
            100 / (data.height / (window.innerHeight - 100)),
            100 / (data.width / (window.innerWidth - 100))
          )
        );
      } catch (error) {
        console.error('Ошибка при отрисовке первого слоя:', error);
        setLayers([]);
        setActiveLayerId(null);
      }
    };

    render();
    return () => {
      setLayers([]);
      setActiveLayerId(null);
    };
  }, [image]);

  const addLayer = async (file: Blob | null, color: string | null) => {
    if (layers.length >= 2) return;

    let imageData: ImageData | null = null;
    let info: ImageInfo | null = null;
    let blob: Blob | null = null;

    if (file) {
      try {
        const isGB7 =
          file.type === 'application/gb7' ||
          (file instanceof File && file.name.toLowerCase().endsWith('.gb7'));

        const data = isGB7 ? await renderGB7(file) : await renderStandartImage(file);
        let hasAlpha = false;
        for (let i = 3; i < data.data.length; i += 4) {
          if (data.data[i] < 255) {
            hasAlpha = true;
            break;
          }
        }

        imageData = data;
        info = {
          width: imageData.width,
          height: imageData.height,
          colorDepth: getColorDepth(imageData, file.type),
          hasAlpha,
        };
        blob = file;
      } catch (error) {
        console.error('Ошибка при добавлении слоя:', error);
        return;
      }
    } else if (color) {
      const width = layers[0]?.info?.width || 100;
      const height = layers[0]?.info?.height || 100;
      imageData = new ImageData(width, height);
      const [r, g, b] = color.match(/\d+/g)!.map(Number);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = 255;
      }
      info = { width, height, colorDepth: 'RGB', hasAlpha: false };
      blob = new Blob([imageData.data], { type: 'image/png' });
    }

    const newLayer: Layer = {
      id: 'second',
      imageData,
      info,
      blob,
      opacity: 1,
      visible: true,
      blendMode: 'normal',
      showAlphaOnly: false,
    };

    setLayers([...layers, newLayer]);
    setActiveLayerId('second');
  };

  const reorderLayers = () => {
    if (layers.length < 2) return;
    setLayers([layers[1], layers[0]]);
  };

  const toggleLayerVisibility = (id: 'first' | 'second') => {
    setLayers(
      layers.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible, showAlphaOnly: layer.visible ? layer.showAlphaOnly : false } : layer
      )
    );
  };

  const deleteLayer = (id: 'first' | 'second') => {
    if (id === 'first') return;
    const newLayers = layers.filter(layer => layer.id !== id);
    setLayers(newLayers);
    setActiveLayerId(newLayers.length > 0 ? 'first' : null);
  };

  const setLayerOpacity = (id: 'first' | 'second', opacity: number) => {
    setLayers(
      layers.map(layer =>
        layer.id === id ? { ...layer, opacity: opacity / 100 } : layer
      )
    );
  };

  const setLayerBlendMode = (
    id: 'first' | 'second',
    blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'
  ) => {
    setLayers(
      layers.map(layer =>
        layer.id === id ? { ...layer, blendMode } : layer
      )
    );
  };

  const toggleAlphaOnly = (id: 'first' | 'second') => {
    setLayers(
      layers.map(layer =>
        layer.id === id ? { ...layer, showAlphaOnly: !layer.showAlphaOnly } : layer
      )
    );
  };

  const handleResize = (options: ImageDataResizeOptions) => {
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    if (!activeLayer || !activeLayer.imageData) return;

    const resized = resizeImageData(activeLayer.imageData, options);
    let hasAlpha = false;
    for (let i = 3; i < resized.data.length; i += 4) {
      if (resized.data[i] < 255) {
        hasAlpha = true;
        break;
      }
    }

    setLayers(
      layers.map(layer =>
        layer.id === activeLayerId
          ? {
              ...layer,
              imageData: resized,
              info: {
                width: resized.width,
                height: resized.height,
                colorDepth: layer.info?.colorDepth || 'Unknown',
                hasAlpha,
              },
              showAlphaOnly: hasAlpha ? layer.showAlphaOnly : false,
            }
          : layer
      )
    );
  };

  const applyCurves = (lut: number[], applyToAlpha: boolean) => {
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    if (!activeLayer || !activeLayer.imageData) return;

    const newImageData = new ImageData(
      new Uint8ClampedArray(activeLayer.imageData.data),
      activeLayer.imageData.width,
      activeLayer.imageData.height
    );

    for (let i = 0; i < newImageData.data.length; i += 4) {
      if (applyToAlpha) {
        newImageData.data[i + 3] = lut[newImageData.data[i + 3]];
      } else {
        newImageData.data[i] = lut[newImageData.data[i]];
        newImageData.data[i + 1] = lut[newImageData.data[i + 1]];
        newImageData.data[i + 2] = lut[newImageData.data[i + 2]];
      }
    }

    setLayers(
      layers.map(layer =>
        layer.id === activeLayerId ? { ...layer, imageData: newImageData } : layer
      )
    );
  };

  const applyKernelFilter = (kernel: number[]) => {
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    if (!activeLayer || !activeLayer.imageData) return;

    const width = activeLayer.imageData.width;
    const height = activeLayer.imageData.height;
    const srcData = activeLayer.imageData.data;
    const newImageData = new ImageData(width, height);

    // Обработка краев методом расширения (padding)
    const paddedWidth = width + 2;
    const paddedHeight = height + 2;
    const paddedData = new Uint8ClampedArray(paddedWidth * paddedHeight * 4);

    // Копирование исходных данных в центр paddedData
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * 4;
        const paddedIndex = ((y + 1) * paddedWidth + (x + 1)) * 4;
        paddedData[paddedIndex] = srcData[srcIndex];
        paddedData[paddedIndex + 1] = srcData[srcIndex + 1];
        paddedData[paddedIndex + 2] = srcData[srcIndex + 2];
        paddedData[paddedIndex + 3] = srcData[srcIndex + 3];
      }
    }

    // Обработка краев (копирование ближайших пикселей)
    // Верхняя и нижняя границы
    for (let x = 0; x < width; x++) {
      const topSrc = (x) * 4;
      const bottomSrc = ((height - 1) * width + x) * 4;
      const topDest = (x + 1) * 4;
      const bottomDest = ((height + 1) * paddedWidth + (x + 1)) * 4;
      paddedData[topDest] = srcData[topSrc];
      paddedData[topDest + 1] = srcData[topSrc + 1];
      paddedData[topDest + 2] = srcData[topSrc + 2];
      paddedData[topDest + 3] = srcData[topSrc + 3];
      paddedData[bottomDest] = srcData[bottomSrc];
      paddedData[bottomDest + 1] = srcData[bottomSrc + 1];
      paddedData[bottomDest + 2] = srcData[bottomSrc + 2];
      paddedData[bottomDest + 3] = srcData[bottomSrc + 3];
    }
    // Левая и правая границы
    for (let y = 0; y < height; y++) {
      const leftSrc = (y * width) * 4;
      const rightSrc = (y * width + (width - 1)) * 4;
      const leftDest = ((y + 1) * paddedWidth) * 4;
      const rightDest = ((y + 1) * paddedWidth + (width + 1)) * 4;
      paddedData[leftDest] = srcData[leftSrc];
      paddedData[leftDest + 1] = srcData[leftSrc + 1];
      paddedData[leftDest + 2] = srcData[leftSrc + 2];
      paddedData[leftDest + 3] = srcData[leftSrc + 3];
      paddedData[rightDest] = srcData[rightSrc];
      paddedData[rightDest + 1] = srcData[rightSrc + 1];
      paddedData[rightDest + 2] = srcData[rightSrc + 2];
      paddedData[rightDest + 3] = srcData[rightSrc + 3];
    }
    // Углы
    paddedData[0] = srcData[0];
    paddedData[1] = srcData[1];
    paddedData[2] = srcData[2];
    paddedData[3] = srcData[3];
    paddedData[(paddedWidth - 1) * 4] = srcData[(width - 1) * 4];
    paddedData[(paddedWidth - 1) * 4 + 1] = srcData[(width - 1) * 4 + 1];
    paddedData[(paddedWidth - 1) * 4 + 2] = srcData[(width - 1) * 4 + 2];
    paddedData[(paddedWidth - 1) * 4 + 3] = srcData[(width - 1) * 4 + 3];
    paddedData[(paddedHeight - 1) * paddedWidth * 4] = srcData[(height - 1) * width * 4];
    paddedData[(paddedHeight - 1) * paddedWidth * 4 + 1] = srcData[(height - 1) * width * 4 + 1];
    paddedData[(paddedHeight - 1) * paddedWidth * 4 + 2] = srcData[(height - 1) * width * 4 + 2];
    paddedData[(paddedHeight - 1) * paddedWidth * 4 + 3] = srcData[(height - 1) * width * 4 + 3];
    paddedData[((paddedHeight - 1) * paddedWidth + (paddedWidth - 1)) * 4] = srcData[((height - 1) * width + (width - 1)) * 4];
    paddedData[((paddedHeight - 1) * paddedWidth + (paddedWidth - 1)) * 4 + 1] = srcData[((height - 1) * width + (width - 1)) * 4 + 1];
    paddedData[((paddedHeight - 1) * paddedWidth + (paddedWidth - 1)) * 4 + 2] = srcData[((height - 1) * width + (width - 1)) * 4 + 2];
    paddedData[((paddedHeight - 1) * paddedWidth + (paddedWidth - 1)) * 4 + 3] = srcData[((height - 1) * width + (width - 1)) * 4 + 3];

    // Применение свертки
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destIndex = (y * width + x) * 4;
        let r = 0, g = 0, b = 0, a = 0;
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const kernelValue = kernel[ky * 3 + kx];
            const srcX = x + kx - 1;
            const srcY = y + ky - 1;
            const srcIndex = ((srcY + 1) * paddedWidth + (srcX + 1)) * 4;
            r += paddedData[srcIndex] * kernelValue;
            g += paddedData[srcIndex + 1] * kernelValue;
            b += paddedData[srcIndex + 2] * kernelValue;
            a += paddedData[srcIndex + 3] * kernelValue;
          }
        }
        newImageData.data[destIndex] = Math.max(0, Math.min(255, Math.round(r)));
        newImageData.data[destIndex + 1] = Math.max(0, Math.min(255, Math.round(g)));
        newImageData.data[destIndex + 2] = Math.max(0, Math.min(255, Math.round(b)));
        newImageData.data[destIndex + 3] = Math.max(0, Math.min(255, Math.round(a)));
      }
    }

    setLayers(
      layers.map(layer =>
        layer.id === activeLayerId ? { ...layer, imageData: newImageData } : layer
      )
    );
  };

  const scale = scalePercent / 100;
  const activeImageInfo = layers.find(layer => layer.id === activeLayerId)?.info || null;
  const activeLayer = layers.find(layer => layer.id === activeLayerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ToolPanel activeTool={activeTool} setActiveTool={setActiveTool} />
      <CanvasRenderer
        layers={layers}
        scale={scale}
        activeTool={activeTool}
        activeLayerId={activeLayerId}
        onColorPick={(color, isSecondary, x, y) => {
          if (isSecondary) {
            setSecondaryColor(color);
            setSecondaryX(x);
            setSecondaryY(y);
          } else {
            setPrimaryColor(color);
            setPrimaryX(x);
            setPrimaryY(y);
          }
        }}
      />
      {activeTool === 'eyedropper' && (
        <EyeDropperInfo
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          primaryX={primaryX}
          primaryY={primaryY}
          secondaryX={secondaryX}
          secondaryY={secondaryY}
        />
      )}
      <div className="canvas-background"></div>
      {activeImageInfo && (
        <>
          <StatusBar
            width={activeImageInfo.width}
            height={activeImageInfo.height}
            colorDepth={activeImageInfo.colorDepth}
          />
          <div className="image-manipulators">
            <ScaleSelector scalePercent={scalePercent} onChange={setScalePercent} />
            <Button
              onClick={() => setIsModalVisible(true)}
              disabled={!activeLayerId || !activeImageInfo}
            >
              Изменить размер изображения
            </Button>
            <Button
              onClick={() => setIsCurvesModalVisible(true)}
              disabled={!activeLayerId || !activeImageInfo}
            >
              Кривые
            </Button>
            <Button
              onClick={() => setIsKernelModalVisible(true)}
              disabled={!activeLayerId || !activeImageInfo || layers.length > 1} // Доступно только при одном слое
            >
              Фильтр свертки
            </Button>
            <SaveImageSelector activeLayer={activeLayer} />
          </div>
        </>
      )}
      {activeImageInfo && (
        <ImageResizerModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onResize={handleResize}
          originalWidth={activeImageInfo.width}
          originalHeight={activeImageInfo.height}
        />
      )}
      {activeImageInfo && (
        <CurvesModal
          visible={isCurvesModalVisible}
          onClose={() => setIsCurvesModalVisible(false)}
          onApply={applyCurves}
          imageData={activeLayer?.imageData || null}
          showAlphaOnly={activeLayer?.showAlphaOnly || false}
        />
      )}
      {activeImageInfo && (
        <KernelFilterModal
          visible={isKernelModalVisible}
          onClose={() => setIsKernelModalVisible(false)}
          onApply={applyKernelFilter}
          imageData={activeLayer?.imageData || null}
        />
      )}
      <LayerSelector
        layers={layers}
        activeLayerId={activeLayerId}
        setActiveLayerId={setActiveLayerId}
        addLayer={addLayer}
        reorderLayers={reorderLayers}
        toggleLayerVisibility={toggleLayerVisibility}
        deleteLayer={deleteLayer}
        setLayerOpacity={setLayerOpacity}
        setLayerBlendMode={setLayerBlendMode}
        toggleAlphaOnly={toggleAlphaOnly}
      />
    </div>
  );
};

export default ImageRenderer;