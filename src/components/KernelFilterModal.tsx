import React, { FC, useState, useEffect } from 'react';
import { Modal, Button, Select, Checkbox, InputNumber } from 'antd';

const { Option } = Select;

interface KernelFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (kernel: number[]) => void;
  imageData: ImageData | null;
}

const KernelFilterModal: FC<KernelFilterModalProps> = ({ visible, onClose, onApply, imageData }) => {
  const [kernel, setKernel] = useState<number[]>([
    0, 0, 0,
    0, 1, 0,
    0, 0, 0,
  ]); // Тождественное отображение по умолчанию
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Предустановленные ядра
  const presetKernels = {
    identity: [0, 0, 0, 0, 1, 0, 0, 0, 0], // Тождественное отображение
    sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0], // Повышение резкости
    gaussian: [1/16, 2/16, 1/16, 2/16, 4/16, 2/16, 1/16, 2/16, 1/16], // Фильтр Гаусса
    boxBlur: [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9], // Прямоугольное размытие
    prewittHorizontal: [-1, 0, 1, -1, 0, 1, -1, 0, 1], // Прюитт (горизонтальный)
    prewittVertical: [-1, -1, -1, 0, 0, 0, 1, 1, 1], // Прюитт (вертикальный)
  };

  useEffect(() => {
    if (!imageData || !showPreview) {
      setPreviewUrl(null);
      return;
    }

    const width = imageData.width;
    const height = imageData.height;
    const srcData = imageData.data;
    const newImageData = new ImageData(width, height);

    // Обработка краев (padding)
    const paddedWidth = width + 2;
    const paddedHeight = height + 2;
    const paddedData = new Uint8ClampedArray(paddedWidth * paddedHeight * 4);

    // Копирование исходных данных
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

    // Применение свертки для предпросмотра
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

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(newImageData, 0, 0);
      setPreviewUrl(canvas.toDataURL());
    }

    return () => {
      setPreviewUrl(null);
    };
  }, [imageData, kernel, showPreview]);

  const handlePresetChange = (value: string) => {
    setKernel([...presetKernels[value as keyof typeof presetKernels]]);
  };

  const handleKernelChange = (index: number, value: number | null) => {
    const newKernel = [...kernel];
    newKernel[index] = value !== null ? value : 0;
    setKernel(newKernel);
  };

  const resetKernel = () => {
    setKernel([...presetKernels.identity]);
  };

  const handleApply = () => {
    onApply(kernel);
    onClose();
  };

  return (
    <Modal
      title="Фильтр свертки"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" onClick={resetKernel}>
          Сброс
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Применить
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Checkbox
          checked={showPreview}
          onChange={(e) => setShowPreview(e.target.checked)}
          disabled={!imageData}
        >
          Показать предпросмотр
        </Checkbox>
        <Select
          defaultValue="identity"
          onChange={handlePresetChange}
          style={{ width: 200 }}
        >
          <Option value="identity">Тождественное отображение</Option>
          <Option value="sharpen">Повышение резкости</Option>
          <Option value="gaussian">Фильтр Гаусса</Option>
          <Option value="boxBlur">Прямоугольное размытие</Option>
          <Option value="prewittHorizontal">Прюитт (горизонтальный)</Option>
          <Option value="prewittVertical">Прюитт (вертикальный)</Option>
        </Select>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: '8px', justifyContent: 'center' }}>
          {kernel.map((value, index) => (
            <InputNumber
              key={index}
              value={value}
              onChange={(val) => handleKernelChange(index, val)}
              style={{ width: '80px' }}
              step={0.1}
            />
          ))}
        </div>
        {showPreview && previewUrl && (
          <img
            src={previewUrl}
            alt="Предпросмотр"
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              border: '1px solid #ddd',
              objectFit: 'contain',
              marginTop: '16px',
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default KernelFilterModal;