import React, { FC, useState } from 'react';
import { Select, Button } from 'antd';
import { Layer } from './ImageRenderer';

const { Option } = Select;

interface SaveImageSelectorProps {
  activeLayer: Layer | undefined;
}

const SaveImageSelector: FC<SaveImageSelectorProps> = ({ activeLayer }) => {
  const [format, setFormat] = useState<'jpg' | 'png' | 'gb7'>('png');

  const saveImage = () => {
    if (!activeLayer || !activeLayer.imageData || !activeLayer.info) return;

    const canvas = document.createElement('canvas');
    canvas.width = activeLayer.imageData.width;
    canvas.height = activeLayer.imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (format === 'gb7') {
      const width = activeLayer.info.width;
      const height = activeLayer.info.height;
      const hasAlpha = activeLayer.info.hasAlpha;
      const pixelDataLength = width * height; // 1 байт на пиксель
      const buffer = new ArrayBuffer(12 + pixelDataLength); // 4 (сигнатура) + 8 (мета) + данные
      const view = new DataView(buffer);

      // Сигнатура файла
      view.setUint8(0, 0x47); // G
      view.setUint8(1, 0x42); // B
      view.setUint8(2, 0x37); // 7
      view.setUint8(3, 0x1D); // Разделитель групп

      // Мета-информация
      view.setUint8(4, 0x01); // Версия
      view.setUint8(5, hasAlpha ? 1 : 0); // Флаг маски (бит 0 = 1 если есть маска, иначе 0)
      view.setUint16(6, width, false); // Ширина (big-endian)
      view.setUint16(8, height, false); // Высота (big-endian)
      view.setUint16(10, 0, false); // Зарезервировано

      // Данные пикселей
      let offset = 12;
      for (let i = 0; i < activeLayer.imageData.data.length; i += 4) {
        const r = activeLayer.imageData.data[i];
        const g = activeLayer.imageData.data[i + 1];
        const b = activeLayer.imageData.data[i + 2];
        const a = activeLayer.imageData.data[i + 3];

        // Вычисляем значение в градациях серого (0–255)
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        // Масштабируем до 7 бит (0–127)
        const gray7Bit = Math.min(127, Math.round(gray / 2));

        let pixelByte: number;
        if (hasAlpha) {
          // Если есть маска, устанавливаем бит 7: 0 (прозрачный) если a < 128, 1 (непрозрачный) если a >= 128
          const maskBit = a < 128 ? 0 : 1;
          pixelByte = (maskBit << 7) | gray7Bit;
        } else {
          // Без маски бит 7 всегда 0
          pixelByte = gray7Bit;
        }

        view.setUint8(offset++, pixelByte);
      }

      const blob = new Blob([buffer], { type: 'application/gb7' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image.gb7`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Для PNG и JPG
      ctx.putImageData(activeLayer.imageData, 0, 0);
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? 0.8 : undefined; // Качество для JPG
      const url = canvas.toDataURL(mimeType, quality);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Select
        value={format}
        onChange={(value: 'jpg' | 'png' | 'gb7') => setFormat(value)}
        style={{ width: 120 }}
      >
        <Option value="png">PNG</Option>
        <Option value="jpg">JPG</Option>
        <Option value="gb7">GB7</Option>
      </Select>
      <Button onClick={saveImage} disabled={!activeLayer || !activeLayer.imageData}>
        Сохранить
      </Button>
    </div>
  );
};

export default SaveImageSelector;