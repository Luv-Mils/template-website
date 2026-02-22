/**
 * Chassis Configuration Types
 *
 * A chassis defines which components appear on the page, in what order,
 * which axes (theme/typography/layout) are available, and the content schema
 * that the AI content generator fills in.
 */

export interface SectionConfig {
  id: string;
  component: string;
  domain: string;
  required: boolean;
  contentKey: string;
  page?: string;
  defaultProps?: Record<string, unknown>;
}

export interface ContentField {
  key: string;
  type: 'text' | 'longtext' | 'list' | 'image' | 'color' | 'phone' | 'email' | 'url' | 'address';
  label: string;
  description: string;
  required: boolean;
  maxLength?: number;
}

export interface AxisOption {
  id: string;
  name: string;
  description: string;
}

export interface ChassisConfig {
  id: string;
  name: string;
  description: string;
  category: 'website';
  sections: SectionConfig[];
  axes: {
    layouts: AxisOption[];
    themes: AxisOption[];
    typography: AxisOption[];
  };
  defaults: {
    layout: string;
    theme: string;
    typography: string;
  };
  contentSchema: ContentField[];
  keywords: string[];
  primaryDomains: string[];
}
