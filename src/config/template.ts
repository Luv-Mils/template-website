import { VibeConfig } from './types';
import defaultConfig from '../../vibe.config.json';

export function resolveConfig(): VibeConfig {
  const params = new URLSearchParams(window.location.search);

  const config: VibeConfig = { ...(defaultConfig as VibeConfig) };

  const chassis = params.get('chassis');
  const layout = params.get('layout');
  const theme = params.get('theme');
  const typography = params.get('typography');

  if (chassis) config.chassis = chassis;
  if (layout) config.layout = layout;
  if (theme) config.theme = theme;
  if (typography) config.typography = typography;

  return config;
}
