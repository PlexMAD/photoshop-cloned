/* eslint-disable jest/no-conditional-expect */
import { colorConverter } from './colorConverter';

describe('colorConverter — формат rgb()', () => {
  test('конвертирует белый цвет rgb(255, 255, 255)', () => {
    const result = colorConverter('rgb(255, 255, 255)');
    expect(result).not.toBeNull();

    if (result) {
      expect(result.XYZ.y).toBeCloseTo(1, 2);       // Яркость Y должна быть близка к 1
      expect(result.Lab.L).toBeCloseTo(100, 1);     // Светлота
      expect(result.Lab.a).toBeCloseTo(0, 1);       // Нейтральный цвет
      expect(result.Lab.b).toBeCloseTo(0, 1);
    }
  });

  test('конвертирует зелёный цвет rgb(0, 255, 0)', () => {
    const result = colorConverter('rgb(0, 255, 0)');
    expect(result).not.toBeNull();

    if (result) {
      expect(result.Lab.a).toBeLessThan(0);  // В Lab зелёный имеет отрицательное a
      expect(result.Lab.L).toBeGreaterThan(80); // Яркий зелёный
    }
  });

  test('конвертирует чёрный цвет rgb(0, 0, 0)', () => {
    const result = colorConverter('rgb(0, 0, 0)');
    expect(result).not.toBeNull();

    if (result) {
      expect(result.Lab.L).toBeCloseTo(0, 1);
    }
  });
});
