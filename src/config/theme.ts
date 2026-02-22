import { ThemeConfig, TypographyConfig } from './types';
import { midnight } from './themes/midnight';
import { ocean } from './themes/ocean';
import { sunset } from './themes/sunset';
import { forest } from './themes/forest';
import { slate } from './themes/slate';
import { coral } from './themes/coral';
import { modern } from './typography/modern';
import { classic } from './typography/classic';
import { friendly } from './typography/friendly';

const THEMES: Record<string, ThemeConfig> = { midnight, ocean, sunset, forest, slate, coral };
const TYPOGRAPHY: Record<string, TypographyConfig> = { modern, classic, friendly };

export function getTheme(id: string): ThemeConfig {
  return THEMES[id] || midnight;
}

export function getTypography(id: string): TypographyConfig {
  return TYPOGRAPHY[id] || modern;
}

export { useTheme } from '../shared/foundation';
