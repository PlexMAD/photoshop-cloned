import React, { useEffect, useState } from 'react';
import { colorConverter } from '../utils/colorConverter';
import { contrast, isContrastSufficient } from '../utils/calculateContrast';

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

  const format = (value: number) => value.toFixed(2);

  const formatXYZ = (xyz: any) =>
    `X: ${format(xyz.x)}, Y: ${format(xyz.y)}, Z: ${format(xyz.z)}`;

  const formatLab = (lab: any) =>
    `L: ${format(lab.L)}, a: ${format(lab.a)}, b: ${format(lab.b)}`;

  const formatOKLch = (oklch: any) =>
    `L: ${format(oklch.L)}, C: ${format(oklch.C)}, h: ${format(oklch.h)}`;

  return (
    <div className="eyedropper-info">
      <div>
        🎯 Первый цвет:{' '}
        <span className="color-swatch" style={{ background: primaryColor || '#fff' }}>
          {primaryColor || '—'}
        </span>
        <p> Координата X: {primaryX} </p>
        <p> Координата Y: {primaryY} </p>
        {primaryData && (
          <div className="color-info">
            <p>XYZ: {formatXYZ(primaryData.XYZ)}</p>
            <p>Lab: {formatLab(primaryData.Lab)}</p>
            <p>OKLch: {formatOKLch(primaryData.OKLch)}</p>
          </div>
        )}
      </div>

      <div>
        🎯 Второй цвет:{' '}
        <span className="color-swatch" style={{ background: secondaryColor || '#fff' }}>
          {secondaryColor || '—'}
        </span>
        <p> Координата X: {secondaryX} </p>
        <p> Координата Y: {secondaryY} </p>
        {secondaryData && (
          <div className="color-info">
            <p>XYZ: {formatXYZ(secondaryData.XYZ)}</p>
            <p>Lab: {formatLab(secondaryData.Lab)}</p>
            <p>OKLch: {formatOKLch(secondaryData.OKLch)}</p>
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
