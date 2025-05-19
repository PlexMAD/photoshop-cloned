import React, { FC, useState, useEffect } from 'react';
import { Button, Switch, Select, Tooltip, Input } from 'antd';
import { renderStandartImage } from '../utils/renderStandartImage';
import { renderGB7 } from '../utils/renderGB7';
import { createPreviewUrl } from '../utils/createPreviewUrl';

const { Option } = Select;

interface Layer {
  id: 'first' | 'second';
  imageData: ImageData | null;
  info: { width: number; height: number; colorDepth: string } | null;
  blob: Blob | null;
  opacity: number;
  visible: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  alphaChannel: ImageData | null;
  alphaVisible: boolean;
}

interface LayerSelectorProps {
  layers: Layer[];
  activeLayerId: 'first' | 'second' | null;
  setActiveLayerId: (id: 'first' | 'second' | null) => void;
  addLayer: (file: Blob | null, color: string | null) => void;
  reorderLayers: () => void;
  toggleLayerVisibility: (id: 'first' | 'second') => void;
  deleteLayer: (id: 'first' | 'second') => void;
  setLayerOpacity: (id: 'first' | 'second', opacity: number) => void;
  setLayerBlendMode: (
    id: 'first' | 'second',
    blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'
  ) => void;
  addAlphaChannel: (layerId: 'first' | 'second', alphaData: ImageData) => void;
  toggleAlphaChannelVisibility: (layerId: 'first' | 'second') => void;
  deleteAlphaChannel: (layerId: 'first' | 'second') => void;
}

const LayerSelector: FC<LayerSelectorProps> = ({
  layers,
  activeLayerId,
  setActiveLayerId,
  addLayer,
  reorderLayers,
  toggleLayerVisibility,
  deleteLayer,
  setLayerOpacity,
  setLayerBlendMode,
  addAlphaChannel,
  toggleAlphaChannelVisibility,
  deleteAlphaChannel,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});
  const [alphaPreviews, setAlphaPreviews] = useState<{ [key: string]: string | null }>({});
  const [color, setColor] = useState<string>('rgb(255, 255, 255)');

  // Рендеринг превью
  useEffect(() => {
    const renderPreviews = async () => {
      const newPreviews: { [key: string]: string | null } = {};
      const newAlphaPreviews: { [key: string]: string | null } = {};

      for (const layer of layers) {
        if (layer.imageData) {
          try {
            newPreviews[layer.id] = createPreviewUrl(layer.imageData);
          } catch (error) {
            console.error(`Ошибка при рендеринге превью слоя ${layer.id}:`, error);
            newPreviews[layer.id] = null;
          }
        } else {
          newPreviews[layer.id] = null;
        }

        if (layer.alphaChannel) {
          try {
            newAlphaPreviews[layer.id] = createPreviewUrl(layer.alphaChannel);
          } catch (error) {
            console.error(`Ошибка при рендеринге превью альфа-канала ${layer.id}:`, error);
            newAlphaPreviews[layer.id] = null;
          }
        } else {
          newAlphaPreviews[layer.id] = null;
        }
      }

      setPreviews(newPreviews);
      setAlphaPreviews(newAlphaPreviews);
    };

    renderPreviews();
  }, [layers]);

  // Обработка загрузки файла
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    isAlpha: boolean,
    layerId: 'first' | 'second'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const render = async () => {
      try {
        const isGB7 =
          file.type === '.gb7' ||
          (file instanceof File && file.name.toLowerCase().endsWith('.gb7'));

        const data = isGB7 ? await renderGB7(file) : await renderStandartImage(file);

        if (isAlpha) {
          const alphaData = new ImageData(data.width, data.height);
          for (let i = 0; i < data.data.length; i += 4) {
            const gray = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3;
            alphaData.data[i] = alphaData.data[i + 1] = alphaData.data[i + 2] = 255;
            alphaData.data[i + 3] = gray;
          }
          addAlphaChannel(layerId, alphaData);
        } else {
          addLayer(file, null);
        }
      } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
      }
    };

    render();
  };

  // Добавление цветного слоя
  const handleColorLayer = () => {
    addLayer(null, color);
  };

  // Изменение прозрачности через ввод
  const handleOpacityChange = (layerId: 'first' | 'second', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setLayerOpacity(layerId, Math.max(0, Math.min(100, numValue)));
    }
  };

  // Увеличение прозрачности на 1
  const increaseOpacity = (layerId: 'first' | 'second') => {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.opacity * 100 < 100) {
      setLayerOpacity(layerId, Math.round(layer.opacity * 100) + 1);
    }
  };

  // Уменьшение прозрачности на 1
  const decreaseOpacity = (layerId: 'first' | 'second') => {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.opacity * 100 > 0) {
      setLayerOpacity(layerId, Math.round(layer.opacity * 100) - 1);
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
        {layers.length < 2 && (
          <div className="layer-selector__add">
            <input
              type="file"
              accept="image/*, .gb7"
              className="layer-selector__file-input"
              onChange={e => handleFileChange(e, false, 'second')}
            />
            <Input
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              placeholder="rgb(255, 255, 255)"
              style={{ marginTop: 8 }}
            />
            <Button onClick={handleColorLayer} style={{ marginTop: 8 }}>
              Добавить цветной слой
            </Button>
          </div>
        )}
        <div className="layer-selector__layers">
          {layers.slice().reverse().map(layer => (
            <div
              key={layer.id}
              className={`layer-selector__item ${
                layer.id === activeLayerId ? 'layer-selector__item--active' : ''
              }`}
              onClick={() => layer.imageData && setActiveLayerId(layer.id)}
              style={{ cursor: layer.imageData ? 'pointer' : 'default' }}
            >
              <div className="layer-selector__title">{layer.id === 'first' ? 'Слой 1' : 'Слой 2'}</div>
              {previews[layer.id] ? (
                <img
                  src={previews[layer.id]!}
                  alt={`Превью ${layer.id}`}
                  className="layer-selector__preview"
                />
              ) : (
                <div className="layer-selector__placeholder">Нет изображения</div>
              )}
              <Switch
                checked={layer.visible}
                onChange={() => toggleLayerVisibility(layer.id)}
                size="small"
                style={{ marginTop: 8 }}
              />
              <Button
                danger
                size="small"
                onClick={() => deleteLayer(layer.id)}
                disabled={layer.id === 'first'}
                style={{ marginTop: 8 }}
              >
                Удалить
              </Button>
              <div className="layer-selector__opacity-control">
                <Button
                  size="small"
                  onClick={() => decreaseOpacity(layer.id)}
                  disabled={layer.opacity * 100 <= 0}
                >
                  −
                </Button>
                <Input
                  type="number"
                  value={Math.round(layer.opacity * 100)}
                  onChange={e => handleOpacityChange(layer.id, e.target.value)}
                  min={0}
                  max={100}
                  step={1}
                  style={{ width: 60, margin: '0 8px' }}
                />
                <Button
                  size="small"
                  onClick={() => increaseOpacity(layer.id)}
                  disabled={layer.opacity * 100 >= 100}
                >
                  +
                </Button>
              </div>
              <Tooltip
                title={
                  layer.blendMode === 'normal'
                    ? 'Обычный: слои накладываются без изменений.'
                    : layer.blendMode === 'multiply'
                    ? 'Умножение: цвета нижнего и верхнего слоёв умножаются.'
                    : layer.blendMode === 'screen'
                    ? 'Экран: цвета инвертируются, умножаются и снова инвертируются.'
                    : 'Наложение: комбинация умножения и экрана в зависимости от яркости.'
                }
              >
                <Select
                  value={layer.blendMode}
                  onChange={(value: 'normal' | 'multiply' | 'screen' | 'overlay') =>
                    setLayerBlendMode(layer.id, value)
                  }
                  style={{ width: 120, marginTop: 8 }}
                >
                  <Option value="normal">Обычный</Option>
                  <Option value="multiply">Умножение</Option>
                  <Option value="screen">Экран</Option>
                  <Option value="overlay">Наложение</Option>
                </Select>
              </Tooltip>
              <div className="layer-selector__alpha">
                <div className="layer-selector__title">Альфа-канал</div>
                {alphaPreviews[layer.id] ? (
                  <img
                    src={alphaPreviews[layer.id]!}
                    alt={`Превью альфа-канала ${layer.id}`}
                    className="layer-selector__preview"
                  />
                ) : (
                  <div className="layer-selector__placeholder">Нет альфа-канала</div>
                )}
                {layer.alphaChannel ? (
                  <>
                    <Switch
                      checked={layer.alphaVisible}
                      onChange={() => toggleAlphaChannelVisibility(layer.id)}
                      size="small"
                      style={{ marginTop: 8 }}
                    />
                    <Button
                      danger
                      size="small"
                      onClick={() => deleteAlphaChannel(layer.id)}
                      style={{ marginTop: 8 }}
                    >
                      Удалить
                    </Button>
                  </>
                ) : (
                  <input
                    type="file"
                    accept="image/*, .gb7"
                    className="layer-selector__file-input"
                    onChange={e => handleFileChange(e, true, layer.id)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            </div>
          ))}
          {layers.length === 2 && (
            <Button onClick={reorderLayers} style={{ marginTop: 8 }}>
              Поменять слои местами
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerSelector;