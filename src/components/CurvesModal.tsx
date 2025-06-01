import React, { FC, useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input, Checkbox } from 'antd';

interface CurvesModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (lut: number[], applyToAlpha: boolean) => void;
  imageData: ImageData | null;
  showAlphaOnly: boolean;
}

const CurvesModal: FC<CurvesModalProps> = ({ visible, onClose, onApply, imageData, showAlphaOnly }) => {
  const [point1, setPoint1] = useState({ in: 0, out: 0 });
  const [point2, setPoint2] = useState({ in: 255, out: 255 });
  const [histograms, setHistograms] = useState<{ r: number[]; g: number[]; b: number[]; a: number[] }>({
    r: new Array(256).fill(0),
    g: new Array(256).fill(0),
    b: new Array(256).fill(0),
    a: new Array(256).fill(0),
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generateLUT = () => {
    const lut = new Array(256).fill(0);
    for (let i = 0; i <= 255; i++) {
      if (i <= point1.in) {
        lut[i] = point1.out;
      } else if (i >= point2.in) {
        lut[i] = point2.out;
      } else {
        const t = (i - point1.in) / (point2.in - point1.in);
        lut[i] = Math.round(point1.out + t * (point2.out - point1.out));
      }
    }
    return lut;
  };

  useEffect(() => {
    if (!imageData) {
      setHistograms({
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0),
        a: new Array(256).fill(0),
      });
      return;
    }

    const lut = generateLUT();
    const r = new Array(256).fill(0);
    const g = new Array(256).fill(0);
    const b = new Array(256).fill(0);
    const a = new Array(256).fill(0);

    for (let i = 0; i < imageData.data.length; i += 4) {
      if (showAlphaOnly) {
        a[lut[imageData.data[i + 3]]]++;
      } else {
        r[lut[imageData.data[i]]]++;
        g[lut[imageData.data[i + 1]]]++;
        b[lut[imageData.data[i + 2]]]++;
      }
    }

    const max = Math.max(...r, ...g, ...b, ...a);
    if (max > 0) {
      for (let i = 0; i < 256; i++) {
        r[i] = (r[i] / max) * 100;
        g[i] = (g[i] / max) * 100;
        b[i] = (b[i] / max) * 100;
        a[i] = (a[i] / max) * 100;
      }
    }

    setHistograms({ r, g, b, a });
  }, [imageData, point1, point2, showAlphaOnly]);

  useEffect(() => {
    if (!imageData || !showPreview) {
      setPreviewUrl(null);
      return;
    }

    const lut = generateLUT();
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    for (let i = 0; i < newImageData.data.length; i += 4) {
      if (showAlphaOnly) {
        newImageData.data[i + 3] = lut[newImageData.data[i + 3]];
      } else {
        newImageData.data[i] = lut[newImageData.data[i]];
        newImageData.data[i + 1] = lut[newImageData.data[i + 1]];
        newImageData.data[i + 2] = lut[newImageData.data[i + 2]];
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = newImageData.width;
    canvas.height = newImageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(newImageData, 0, 0);
      setPreviewUrl(canvas.toDataURL());
    }

    return () => {
      setPreviewUrl(null);
    };
  }, [imageData, point1, point2, showPreview, showAlphaOnly]);

  const handleInputChange = (point: 'point1' | 'point2', field: 'in' | 'out', value: string) => {
    let num = Math.max(0, Math.min(255, parseInt(value) || 0));

    if (point === 'point1') {
      if (field === 'in') {
        num = Math.min(num, point2.in - 1);
      }
      setPoint1(prev => ({ ...prev, [field]: num }));
    } else {
      if (field === 'in') {
        num = Math.max(num, point1.in + 1);
        if (num <= point1.in) {
          setPoint1(prev => ({ ...prev, in: num - 1 }));
        }
      }
      setPoint2(prev => ({ ...prev, [field]: num }));
    }
  };

  const resetValues = () => {
    setPoint1({ in: 0, out: 0 });
    setPoint2({ in: 255, out: 255 });
  };

  const handleApply = () => {
    const lut = generateLUT();
    onApply(lut, showAlphaOnly);
    onClose();
  };

  const graphWidth = 300;
  const graphHeight = 400; // Увеличиваем высоту гистограммы
  const x1 = (point1.in / 255) * graphWidth;
  const y1 = graphHeight - (point1.out / 255) * graphHeight;
  const x2 = (point2.in / 255) * graphWidth;
  const y2 = graphHeight - (point2.out / 255) * graphHeight;

  const createHistogramPath = (data: number[]) => {
    const points = data.map((value, i) => `${(i / 255) * graphWidth},${graphHeight - (value / 100) * graphHeight}`);
    return `M0,${graphHeight} ${points.join(' L')} L${graphWidth},${graphHeight} Z`;
  };

  return (
    <Modal
      title="Кривые"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="reset" onClick={resetValues}>
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
        <div style={{ display: 'flex', gap: '24px', overflow: 'auto', maxWidth: '100%' }}>
          <div>
            <svg
              width={graphWidth}
              height={graphHeight}
              style={{ border: '1px solid #ddd', background: '#f5f5f5' }}
            >
              <line x1="0" y1="0" x2="0" y2={graphHeight} stroke="#000" strokeWidth="1" />
              <line x1="0" y1={graphHeight} x2={graphWidth} y2={graphHeight} stroke="#000" strokeWidth="1" />
              <text x={-graphHeight + 20} y="20" transform={`rotate(-90)`} fontSize="12" fill="#333">
                Выход
              </text>
              <text x={graphWidth - 40} y={graphHeight - 5} fontSize="12" fill="#333">
                Вход
              </text>
              {[0, 64, 128, 192, 255].map(val => {
                const x = (val / 255) * graphWidth;
                const y = graphHeight - (val / 255) * graphHeight;
                return (
                  <g key={val}>
                    <line x1={x} y1={graphHeight - 5} x2={x} y2={graphHeight} stroke="#000" strokeWidth="1" />
                    <text x={x - 10} y={graphHeight - 10} fontSize="10" fill="#333">{val}</text>
                    <line x1="0" y1={y} x2="5" y2={y} stroke="#000" strokeWidth="1" />
                    <text x="10" y={y + 4} fontSize="10" fill="#333">{val}</text>
                  </g>
                );
              })}
              {!showAlphaOnly && (
                <>
                  <path d={createHistogramPath(histograms.r)} fill="rgba(255, 0, 0, 0.3)" />
                  <path d={createHistogramPath(histograms.g)} fill="rgba(0, 255, 0, 0.3)" />
                  <path d={createHistogramPath(histograms.b)} fill="rgba(0, 0, 255, 0.3)" />
                </>
              )}
              {showAlphaOnly && (
                <path d={createHistogramPath(histograms.a)} fill="rgba(0, 0, 0, 0.3)" />
              )}
              <line x1="0" y1={y1} x2={x1} y2={y1} stroke="#000" strokeWidth="1" />
              <line x1={x2} y1={y2} x2={graphWidth} y2={y2} stroke="#000" strokeWidth="1" />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="2" />
              <circle cx={x1} cy={y1} r="5" fill="red" />
              <circle cx={x2} cy={y2} r="5" fill="red" />
            </svg>
          </div>
          {showPreview && previewUrl && (
            <div>
              <img
                src={previewUrl}
                alt="Предпросмотр"
                style={{
                  maxWidth: '350px',
                  maxHeight: '350px',
                  border: '1px solid #ddd',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Точка 1: Вход</label>
            <Input
              type="number"
              value={point1.in}
              onChange={(e) => handleInputChange('point1', 'in', e.target.value)}
              min={0}
              max={point2.in - 1}
              style={{ width: '100px', marginTop: '8px', fontSize: '14px' }}
            />
            <label style={{ marginTop: '12px', fontSize: '14px', fontWeight: 'bold' }}>Выход</label>
            <Input
              type="number"
              value={point1.out}
              onChange={(e) => handleInputChange('point1', 'out', e.target.value)}
              min={0}
              max={255}
              style={{ width: '100px', marginTop: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Точка 2: Вход</label>
            <Input
              type="number"
              value={point2.in}
              onChange={(e) => handleInputChange('point2', 'in', e.target.value)}
              min={point1.in + 1}
              max={255}
              style={{ width: '100px', marginTop: '8px', fontSize: '14px' }}
            />
            <label style={{ marginTop: '12px', fontSize: '14px', fontWeight: 'bold' }}>Выход</label>
            <Input
              type="number"
              value={point2.out}
              onChange={(e) => handleInputChange('point2', 'out', e.target.value)}
              min={0}
              max={255}
              style={{ width: '100px', marginTop: '8px', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CurvesModal;