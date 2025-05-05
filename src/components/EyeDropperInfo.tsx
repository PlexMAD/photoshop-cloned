import React, { useEffect, useState } from 'react';
import { colorConverter } from '../utils/colorConverter';
import Tooltip from './Tooltip';
import { contrast, isContrastSufficient } from '../utils/calculateContrast'; // Импортируем функции

interface EyeDropperInfoProps {
  primaryColor: string | null;
  secondaryColor: string | null;
  primaryX: number | null;
  primaryY: number | null;
  secondaryX: number | null;
  secondaryY: number | null;
}

const EyeDropperInfo: React.FC<EyeDropperInfoProps> = ({
  primaryColor,
  secondaryColor,
  primaryX,
  primaryY,
  secondaryX,
  secondaryY
}) => {
  const [primaryData, setPrimaryData] = useState<any>(null);
  const [secondaryData, setSecondaryData] = useState<any>(null);
  const [contrastRatio, setContrastRatio] = useState<number | null>(null);
  const [isContrastEnough, setIsContrastEnough] = useState<boolean | null>(null);

  const updatePrimary = (color: string) => {
    const result = colorConverter(color);
    if (result) {
      setPrimaryData(result);
    }
  };

  const updateSecondary = (color: string) => {
    const result = colorConverter(color);
    if (result) {
      setSecondaryData(result);
    }
  };

  useEffect(() => {
    if (primaryColor) updatePrimary(primaryColor);
    if (secondaryColor) updateSecondary(secondaryColor);
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    if (primaryColor && secondaryColor) {
      try {
        const ratio = contrast(primaryColor, secondaryColor);
        setContrastRatio(ratio);
        setIsContrastEnough(isContrastSufficient(ratio));
      } catch (error) {
        console.error(error); 
        setContrastRatio(null);
        setIsContrastEnough(null);
      }
    }
  }, [primaryColor, secondaryColor]);

  return (
    <div className="eyedropper-info">
      <div>
        🎯 Первый цвет:{' '}
        <span className="color-swatch" style={{ background: primaryColor || '#fff' }}>
          {primaryColor || '—'}
        </span>
        <span>Координаты: {primaryX} {primaryY}</span>
        {primaryData && (
          <div className="color-info">
            <Tooltip label={primaryData.XYZ} title="XYZ" />
            <Tooltip label={primaryData.Lab} title="Lab" />
            <Tooltip label={primaryData.OKLch} title="OKLch" />
          </div>
        )}
      </div>

      <div>
        🎯 Второй цвет:{' '}
        <span className="color-swatch" style={{ background: secondaryColor || '#fff' }}>
          {secondaryColor || '—'}
        </span>
        <span>Координаты: {secondaryX} {secondaryY}</span>
        {secondaryData && (
          <div className="color-info">
            <Tooltip label={secondaryData.XYZ} title="XYZ" />
            <Tooltip label={secondaryData.Lab} title="Lab" />
            <Tooltip label={secondaryData.OKLch} title="OKLch" />
          </div>
        )}
      </div>

      {contrastRatio !== null && (
        <div className="contrast-info">
          <p>
            Контраст: {contrastRatio.toFixed(2)}{' '}
            {isContrastEnough ? (
              <span style={{ color: 'green' }}>Достаточный</span>
            ) : (
              <span style={{ color: 'red' }}>Недостаточный</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default EyeDropperInfo;
