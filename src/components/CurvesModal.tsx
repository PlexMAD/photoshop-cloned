import React, { FC, useState, useEffect } from 'react';
import { Modal, Button, Input } from 'antd';

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

  useEffect(() => {
    if (!imageData) return;

    const r = new Array(256).fill(0);
    const g = new Array(256).fill(0);
    const b = new Array(256).fill(0);
    const a = new Array(256).fill(0);

    for (let i = 0; i < imageData.data.length; i += 4) {
      r[imageData.data[i]]++;
      g[imageData.data[i + 1]]++;
      b[imageData.data[i + 2]]++;
      a[imageData.data[i + 3]]++;
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
  }, [imageData]);

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

  const graphSize = 300;
  const x1 = (point1.in / 255) * graphSize;
  const y1 = graphSize - (point1.out / 255) * graphSize;
  const x2 = (point2.in / 255) * graphSize;
  const y2 = graphSize - (point2.out / 255) * graphSize;

  const createHistogramPath = (data: number[]) => {
    const points = data.map((value, i) => `${(i / 255) * graphSize},${graphSize - value}`);
    return `M0,${graphSize} ${points.join(' L')} L${graphSize},${graphSize} Z`;
  };

  return (
    <Modal
      title="Кривые"
      open={visible}
      onCancel={onClose}
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
        <div style={{ overflow: 'auto', maxWidth: '100%' }}>
          <svg width={graphSize} height={graphSize} style={{ border: '1px solid #ddd', background: '#f5f5f5' }}>
            <line x1="0" y1="0" x2="0" y2={graphSize} stroke="#000" strokeWidth="1" />
            <line x1="0" y1={graphSize} x2={graphSize} y2={graphSize} stroke="#000" strokeWidth="1" />
            <text x={-graphSize + 20} y="20" transform={`rotate(-90)`} fontSize="12" fill="#333">
              Выход
            </text>
            <text x={graphSize - 40} y={graphSize - 5} fontSize="12" fill="#333">
              Вход
            </text>
            {[0, 64, 128, 192, 255].map(val => {
              const x = (val / 255) * graphSize;
              const y = graphSize - (val / 255) * graphSize;
              return (
                <g key={val}>
                  <line x1={x} y1={graphSize - 5} x2={x} y2={graphSize} stroke="#000" strokeWidth="1" />
                  <text x={x - 10} y={graphSize - 10} fontSize="10" fill="#333">{val}</text>
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
            <line x1={x2} y1={y2} x2={graphSize} y2={y2} stroke="#000" strokeWidth="1" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="2" />
            <circle cx={x1} cy={y1} r="5" fill="red" />
            <circle cx={x2} cy={y2} r="5" fill="red" />
          </svg>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div>
            <label>Точка 1: Вход</label>
            <Input
              type="number"
              value={point1.in}
              onChange={(e) => handleInputChange('point1', 'in', e.target.value)}
              min={0}
              max={point2.in - 1}
              style={{ width: '80px', marginTop: '8px' }}
            />
            <label style={{ marginTop: '8px' }}>Выход</label>
            <Input
              type="number"
              value={point1.out}
              onChange={(e) => handleInputChange('point1', 'out', e.target.value)}
              min={0}
              max={255}
              style={{ width: '80px', marginTop: '8px' }}
            />
          </div>
          <div>
            <label>Точка 2: Вход</label>
            <Input
              type="number"
              value={point2.in}
              onChange={(e) => handleInputChange('point2', 'in', e.target.value)}
              min={point1.in + 1}
              max={255}
              style={{ width: '80px', marginTop: '8px' }}
            />
            <label style={{ marginTop: '8px' }}>Выход</label>
            <Input
              type="number"
              value={point2.out}
              onChange={(e) => handleInputChange('point2', 'out', e.target.value)}
              min={0}
              max={255}
              style={{ width: '80px', marginTop: '8px' }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CurvesModal;