import React, { FC, useState, useEffect } from 'react';
import { renderGB7 } from '../utils/renderGB7';
import { renderStandartImage } from '../utils/renderStandartImage';
import { createPreviewUrl } from '../utils/createPreviewUrl';

interface LayerSelectorProps {
  image: Blob | null;
  secondImage: Blob | null;
  setSecondImage: (secondImage: Blob) => void;
}

const LayerSelector: FC<LayerSelectorProps> = ({ image, secondImage, setSecondImage }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [firstLayerPreview, setFirstLayerPreview] = useState<string | null>(null);
  const [secondLayerPreview, setSecondLayerPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      console.log('No image provided for first layer');
      setFirstLayerPreview(null);
      return;
    }

    const render = async () => {
      try {
        const isGB7 =
          image.type === 'application/gb7' ||
          (image instanceof File && image.name.toLowerCase().endsWith('.gb7'));

        console.log(`Rendering first layer, isGB7: ${isGB7}`);
        const data = isGB7
          ? await renderGB7(image)
          : await renderStandartImage(image);

        const previewUrl = createPreviewUrl(data);
        setFirstLayerPreview(previewUrl);
      } catch (error) {
        console.error('Ошибка при рендеринге превью первого слоя:', error);
        setFirstLayerPreview(null);
      }
    };

    render();
  }, [image]);

  // Обработка второго слоя
  useEffect(() => {
    if (!secondImage) {
      console.log('No second image provided');
      setSecondLayerPreview(null);
      return;
    }

    const render = async () => {
      try {
        const isGB7 =
          secondImage.type === 'application/gb7' ||
          (secondImage instanceof File && secondImage.name.toLowerCase().endsWith('.gb7'));

        console.log(`Rendering second layer, isGB7: ${isGB7}`);
        const data = isGB7
          ? await renderGB7(secondImage)
          : await renderStandartImage(secondImage);

        const previewUrl = createPreviewUrl(data);
        setSecondLayerPreview(previewUrl);
      } catch (error) {
        console.error('Ошибка при рендеринге превью второго слоя:', error);
        setSecondLayerPreview(null);
      }
    };

    render();
  }, [secondImage]);

  // Обработка загрузки второго изображения
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected for second layer:', file.name);
      setSecondImage(file);
    }
  };

  return (
    <div className={`layer-selector ${isVisible ? 'layers-visible' : ''}`}>
      <button
        className="layer-selector__button"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? '→' : '←'}
      </button>
      <div className="layer-selector__content">
        <div className="layer-selector__item">
          <div className="layer-selector__title">Слой 1</div>
          {firstLayerPreview ? (
            <img
              src={firstLayerPreview}
              alt="Превью первого слоя"
              className="layer-selector__preview"
            />
          ) : (
            <div className="layer-selector__placeholder">Нет изображения</div>
          )}
        </div>
        <div className="layer-selector__item">
          <div className="layer-selector__title">Слой 2</div>
          {secondLayerPreview ? (
            <img
              src={secondLayerPreview}
              alt="Превью второго слоя"
              className="layer-selector__preview"
            />
          ) : (
            <div className="layer-selector__placeholder">Нет изображения</div>
          )}
          {!secondImage && (
            <input
              type="file"
              accept="image/*,application/gb7"
              className="layer-selector__file-input"
              onChange={handleFileChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerSelector;