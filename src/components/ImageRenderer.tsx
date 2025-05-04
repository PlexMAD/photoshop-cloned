import { FC, useEffect, useState } from 'react';
import { Button, Select } from 'antd'; // импорт Select
import { renderGB7 } from '../utils/renderGB7';
import { renderStandardImage } from '../utils/renderStandartImages';
import { getColorDepth } from '../utils/getColorDepth';
import StatusBar from './StatusBar';
import CanvasRenderer from './CanvasRenderer';
import { resizeImageData, ImageDataResizeOptions } from '../utils/imageResize';
import ImageResizerModal from './ImageResizerModal';

const { Option } = Select;

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
  const [scalePercent, setScalePercent] = useState(100); // Масштаб в %

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

  const scaleOptions = [12, 25, 50, 75, 100, 150, 200, 300];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {imageData && <CanvasRenderer imageData={imageData} scale={scale} />}
      {imageInfo && (
        <>
          <StatusBar
            width={imageInfo.width}
            height={imageInfo.height}
            colorDepth={imageInfo.colorDepth}
          />

          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', zIndex: '1' }}>
            <span>Масштаб:</span>
            <Select
              value={scalePercent}
              onChange={(val) => setScalePercent(val)}
              style={{ width: 120 }}
            >
              {scaleOptions.map((percent) => (
                <Option key={percent} value={percent}>
                  {percent}%
                </Option>
              ))}
            </Select>

            <Button onClick={() => setIsModalVisible(true)}>Изменить размеры изображения</Button>
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
