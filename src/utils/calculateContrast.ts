// calculateContrast.ts

// Функция для вычисления яркости цвета
export function luminance(r: number, g: number, b: number): number {
    const a = [r / 255, g / 255, b / 255].map((val) =>
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    );
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  
  // Функция для извлечения значений RGB из строки формата rgb(r, g, b) <--------
  export function rgbToRgbArray(rgb: string): { r: number, g: number, b: number } | null {
    const result = rgb.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
    if (result) {
      const r = parseInt(result[1], 10);
      const g = parseInt(result[2], 10);
      const b = parseInt(result[3], 10);
      return { r, g, b };
    }
    return null;
  }
  
  // Функция для вычисления контраста между двумя цветами в формате rgb(r, g, b)
  export function contrast(color1: string, color2: string): number {
    const rgb1 = rgbToRgbArray(color1);
    const rgb2 = rgbToRgbArray(color2);
  
    if (!rgb1 || !rgb2) {
      throw new Error('Invalid color format');
    }
  
    const luminance1 = luminance(rgb1.r, rgb1.g, rgb1.b);
    const luminance2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  
    const L1 = Math.max(luminance1, luminance2);
    const L2 = Math.min(luminance1, luminance2);
    return (L1 + 0.05) / (L2 + 0.05);
  }
  
  export function isContrastSufficient(contrastRatio: number): boolean {
    return contrastRatio >= 4.5;
  }
  