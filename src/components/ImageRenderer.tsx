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

const ImageRenderer: FC<ImageRendererProps> = ({ image }) => {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scalePercent, setScalePercent] = useState(100);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [primaryX, setPrimaryX] = useState<number | null>(null);
  const [primaryY, setPrimaryY] = useState<number | null>(null);
  const [secondaryX, setSecondaryX] = useState<number | null>(null);
  const [secondaryY, setSecondaryY] = useState<number | null>(null);
  const [secondImage, setSecondImage] = useState<Blob | null>(null);
  const [secondLayerImageData, setSecondLayerImageData] = useState<ImageData | null>(null);

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

        setImageData(data);
        setImageInfo({
          width: data.width,
          height: data.height,
          colorDepth: getColorDepth(data, image.type),
        });
        setScalePercent(
          Math.min(
            100 / (data.height / (window.innerHeight - 100)),
            100 / (data.width / (window.innerWidth - 100))
          )
        );
      } catch (error) {
        console.error('Ошибка при отрисовке первого слоя:', error);
        setImageInfo(null);
        setImageData(null);
      }
    };

    render();
    return () => {
      setImageInfo(null);
      setImageData(null);
    };
  }, [image]);

  // Рендеринг второго слоя
  useEffect(() => {
    const render = async () => {
      if (!secondImage) {
        setSecondLayerImageData(null);
        return;
      }

      try {
        const isGB7 =
          secondImage.type === 'application/gb7' ||
          (secondImage instanceof File && secondImage.name.toLowerCase().endsWith('.gb7'));

        const data = isGB7
          ? await renderGB7(secondImage)
          : await renderStandartImage(secondImage);

        setSecondLayerImageData(data);
      } catch (error) {
        console.error('Ошибка при отрисовке второго слоя:', error);
        setSecondLayerImageData(null);
      }
    };

    render();
  }, [secondImage]);

  const handleResize = (options: ImageDataResizeOptions) => {
    if (!imageData) return;
    const resized = resizeImageData(imageData, options);
    setImageData(resized);
    setImageInfo({
      width: resized.width,
      height: resized.height,
      colorDepth: imageInfo?.colorDepth || 'Unknown',
    });
  };

  const scale = scalePercent / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ToolPanel activeTool={activeTool} setActiveTool={setActiveTool} />

      {imageData && (
        <CanvasRenderer
          imageData={imageData}
          scale={scale}
          activeTool={activeTool}
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
      )}

      {secondLayerImageData && (
        <CanvasRenderer
          imageData={secondLayerImageData}
          scale={scale}
          activeTool={activeTool}
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
      )}

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
      {imageInfo && (
        <>
          <StatusBar
            width={imageInfo.width}
            height={imageInfo.height}
            colorDepth={imageInfo.colorDepth}
          />
          <div className="image-manipulators">
            <ScaleSelector scalePercent={scalePercent} onChange={setScalePercent} />
            <Button onClick={() => setIsModalVisible(true)}>
              Изменить размер изображения
            </Button>
          </div>
        </>
      )}

      {imageInfo && (
        <ImageResizerModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onResize={handleResize}
          originalWidth={imageInfo.width}
          originalHeight={imageInfo.height}
        />
      )}
      <LayerSelector
        image={image}
        secondImage={secondImage}
        setSecondImage={setSecondImage}
      />
    </div>
  );
};

export default ImageRenderer;