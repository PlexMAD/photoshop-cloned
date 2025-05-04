import React from 'react';

interface EyeDropperInfoProps {
  primaryColor: string | null;
  secondaryColor: string | null;
}

const EyeDropperInfo: React.FC<EyeDropperInfoProps> = ({ primaryColor, secondaryColor }) => {
  return (
    <div className="eyedropper-info">
      <div>
        🎯 Первый цвет:{' '}
        <span className="color-swatch" style={{ background: primaryColor || '#fff' }}>
          {primaryColor || '—'}
        </span>
      </div>
      <div>
        🎯 Второй цвет:{' '}
        <span className="color-swatch" style={{ background: secondaryColor || '#fff' }}>
          {secondaryColor || '—'}
        </span>
      </div>
    </div>
  );
};

export default EyeDropperInfo;
