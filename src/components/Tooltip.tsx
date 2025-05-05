import React from 'react';

interface TooltipProps {
  title: string;
  label: Record<string, number | string> | null;
}

const Tooltip: React.FC<TooltipProps> = ({ title, label }) => {
  if (!label || typeof label !== 'object') return null;

  return (
    <div className="tooltip-container" tabIndex={0}>
      {title}
      <div className="tooltip-content">
        {Object.entries(label).map(([key, value]) => (
          <div key={key}>
            {key}: {value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tooltip;
