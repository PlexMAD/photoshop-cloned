import React, { FC, useState, useEffect } from 'react';
import { Button, Switch, Select, Tooltip, Input } from 'antd';
import { createPreviewUrl } from '../utils/createPreviewUrl';

const { Option } = Select;

interface Layer {
  id: 'first' | 'second';
  imageData: ImageData | null;
  info: { width: number; height: number; colorDepth: string; hasAlpha: boolean } | null;
  blob: Blob | null;
  opacity: number;
  visible: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  showAlphaOnly: boolean;
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
  toggleAlphaOnly: (id: 'first' | 'second') => void;
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
  toggleAlphaOnly,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});
  const [color, setColor] = useState<string>('rgb(255, 255, 255)');

  useEffect(() => {
    const renderPreviews = async () => {
      const newPreviews: { [key: string]: string | null } = {};

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
      }

      setPreviews(newPreviews);
    };

    renderPreviews();
  }, [layers]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    addLayer(file, null);
  };

  const handleColorLayer = () => {
    addLayer(null, color);
  };

  const handleOpacityChange = (layerId: 'first' | 'second', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setLayerOpacity(layerId, Math.max(0, Math.min(100, numValue)));
    }
  };

  const increaseOpacity = (layerId: 'first' | 'second') => {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.opacity * 100 < 100) {
      setLayerOpacity(layerId, Math.round(layer.opacity * 100) + 1);
    }
  };

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
              onChange={handleFileChange}
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
              <div style={{ marginTop: 8 }}>
                Альфа-канал: {layer.info?.hasAlpha ? 'Есть' : 'Нет'}
              </div>
              {layer.info?.hasAlpha && (
                <div style={{ marginTop: 8 }}>
                  <Switch
                    checked={layer.showAlphaOnly}
                    onChange={() => toggleAlphaOnly(layer.id)}
                    size="small"
                    disabled={!layer.visible}
                  />
                  <span style={{ marginLeft: 8 }}>Показать только альфа-канал</span>
                </div>
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