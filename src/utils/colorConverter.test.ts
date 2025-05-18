/* eslint-disable jest/no-conditional-expect */
import { colorConverter } from './colorConverter';

describe('colorConverter', () => {
  test('конвертирует #ffffff (белый цвет)', () => {
    const result = colorConverter('#ffffff');
    expect(result).not.toBeNull();

    if (result) {
      // Проверим XYZ — Y должно быть близко к 1
      expect(result.XYZ.y).toBeCloseTo(1, 2);

      // Lab — L должен быть около 100, a и b около 0
      expect(result.Lab.L).toBeCloseTo(100, 1);
      expect(result.Lab.a).toBeCloseTo(0, 1);
      expect(result.Lab.b).toBeCloseTo(0, 1);
    }
  });

  test('возвращает null при неверном формате (#gggggg)', () => {
    const result = colorConverter('#gggggg');
    expect(result).toBeNull();
  });
});
