import React, { FC, useEffect, useState } from 'react';
import { Button } from 'antd';
import { renderGB7 } from '../utils/renderGB7';
import { renderStandardImage } from '../utils/renderStandartImages';
import { getColorDepth } from '../utils/getColorDepth';
import StatusBar from './StatusBar';
import CanvasRenderer from './CanvasRenderer';
import { resizeImageData, ImageDataResizeOptions } from '../utils/imageResize';
import ImageResizerModal from './ImageResizerModal';
import ScaleSelector from './ScaleSelector';
import ToolPanel, { Tool } from './ToolPanel';

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
  const [activeTool, setActiveTool] = useState<Tool | null>(null); // состояние для активного инструмента

  useEffect(() => {
    const render = async () => {
      if (!image) return;

      try {
        const isGB7 = image.type === 'application/gb7' ||
          (image instanceof File && image.name.toLowerCase().endsWith('.gb7'));

        const data = isGB7
          ? await renderGB7(image)
          : await renderStandardImage(image);

        setImageData(data);
        setImageInfo({
          width: data.width,
          height: data.height,
          colorDepth: getColorDepth(data, image.type),
        });
      } catch (error) {
        console.error('Ошибка при отрисовке:', error);
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
      
      {imageData && <CanvasRenderer imageData={imageData} scale={scale} />}
      
      {imageInfo && (
        <>
          <StatusBar
            width={imageInfo.width}
            height={imageInfo.height}
            colorDepth={imageInfo.colorDepth}
          />
          <div className='image-manipulators'>
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
    </div>
  );
};

export default ImageRenderer;
