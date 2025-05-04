import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

interface ScaleSelectorProps {
  scalePercent: number;
  onChange: (value: number) => void;
}

const ScaleSelector: React.FC<ScaleSelectorProps> = ({ scalePercent, onChange }) => {
  const scaleOptions = [12, 25, 50, 75, 100, 150, 200, 300];

  return (
    <div className="scale-selector">
      <span className="scale-label">Масштаб:</span>
      <Select
        value={scalePercent}
        onChange={onChange}
        className="scale-select"
      >
        {scaleOptions.map((percent) => (
          <Option key={percent} value={percent}>
            {percent}%
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default ScaleSelector;
