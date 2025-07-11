import { FC, useEffect, useState } from 'react';
import { Button } from 'antd';
import { renderGB7 } from '../utils/renderGB7';
import { renderStandardImage } from '../utils/renderStandartImages';
import { getColorDepth } from '../utils/getColorDepth';
import StatusBar from './StatusBar';
import CanvasRenderer from './CanvasRenderer';
import { resizeImageData, ImageDataResizeOptions } from '../utils/imageResize';
import ImageResizerModal from './ImageResizerModal';


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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {imageData && <CanvasRenderer imageData={imageData} />}
      {imageInfo && (
        <>
          <StatusBar
            width={imageInfo.width}
            height={imageInfo.height}
            colorDepth={imageInfo.colorDepth}
          />
          <Button onClick={() => setIsModalVisible(true)} style={{ marginTop: 16 }}>
            Изменить масштаб
          </Button>
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
