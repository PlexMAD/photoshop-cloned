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

interface ImageRendererProps {
  image: Blob;
}

interface ImageInfo {
  width: number;
  height: number;
  colorDepth: string;
}

interface Layer {
  id: 'first' | 'second';
  imageData: ImageData | null;
  info: ImageInfo | null;
  blob: Blob | null;
  opacity: number;
  visible: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  alphaChannel: ImageData | null;
  alphaVisible: boolean;
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
      alphaChannel: null,
      alphaVisible: true,
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<'first' | 'second' | null>('first');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scalePercent, setScalePercent] = useState(100);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [primaryX, setPrimaryX] = useState<number | null>(null);
  const [primaryY, setPrimaryY] = useState<number | null>(null);
  const [secondaryX, setSecondaryX] = useState<number | null>(null);
  const [secondaryY, setSecondaryY] = useState<number | null>(null);

  // Рендеринг первого слоя
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

        setLayers([
          {
            id: 'first',
            imageData: data,
            info: {
              width: data.width,
              height: data.height,
              colorDepth: getColorDepth(data, image.type),
            },
            blob: image,
            opacity: 1,
            visible: true,
            blendMode: 'normal',
            alphaChannel: null,
            alphaVisible: true,
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

  // Добавление второго слоя
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

        imageData = isGB7 ? await renderGB7(file) : await renderStandartImage(file);
        info = {
          width: imageData.width,
          height: imageData.height,
          colorDepth: getColorDepth(imageData, file.type),
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
      info = { width, height, colorDepth: 'RGB' };
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
      alphaChannel: null,
      alphaVisible: true,
    };

    setLayers([...layers, newLayer]);
    setActiveLayerId('second');
  };

  // Изменение порядка слоёв
  const reorderLayers = () => {
    if (layers.length < 2) return;
    setLayers([layers[1], layers[0]]);
  };

  // Переключение видимости слоя
  const toggleLayerVisibility = (id: 'first' | 'second') => {
    setLayers(
      layers.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  // Удаление слоя
  const deleteLayer = (id: 'first' | 'second') => {
    if (id === 'first') return; // Первый слой нельзя удалить
    const newLayers = layers.filter(layer => layer.id !== id);
    setLayers(newLayers);
    setActiveLayerId(newLayers.length > 0 ? 'first' : null);
  };

  // Изменение непрозрачности
  const setLayerOpacity = (id: 'first' | 'second', opacity: number) => {
    setLayers(
      layers.map(layer =>
        layer.id === id ? { ...layer, opacity: opacity / 100 } : layer
      )
    );
  };

  // Изменение режима наложения
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

  // Добавление альфа-канала
  const addAlphaChannel = (layerId: 'first' | 'second', alphaData: ImageData) => {
    setLayers(
      layers.map(layer =>
        layer.id === layerId ? { ...layer, alphaChannel: alphaData, alphaVisible: true } : layer
      )
    );
  };

  // Переключение видимости альфа-канала
  const toggleAlphaChannelVisibility = (layerId: 'first' | 'second') => {
    setLayers(
      layers.map(layer =>
        layer.id === layerId ? { ...layer, alphaVisible: !layer.alphaVisible } : layer
      )
    );
  };

  // Удаление альфа-канала
  const deleteAlphaChannel = (layerId: 'first' | 'second') => {
    setLayers(
      layers.map(layer =>
        layer.id === layerId ? { ...layer, alphaChannel: null, alphaVisible: true } : layer
      )
    );
  };

  // Изменение размера
  const handleResize = (options: ImageDataResizeOptions) => {
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    if (!activeLayer || !activeLayer.imageData) return;

    const resized = resizeImageData(activeLayer.imageData, options);
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
              },
            }
          : layer
      )
    );
  };

  const scale = scalePercent / 100;

  const activeImageInfo =
    layers.find(layer => layer.id === activeLayerId)?.info || null;

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
        addAlphaChannel={addAlphaChannel}
        toggleAlphaChannelVisibility={toggleAlphaChannelVisibility}
        deleteAlphaChannel={deleteAlphaChannel}
      />
    </div>
  );
};

export default ImageRenderer;