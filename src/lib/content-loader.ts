/**
 * Content Loader — defensive rendering layer.
 *
 * Loads content.json from the repo root, validates every field,
 * and returns guaranteed-shape data with defaults for missing/malformed fields.
 *
 * Usage in components:
 *   import { useContent } from '../lib/content-loader';
 *   const { content, section } = useContent();
 *   const hero = section('hero');
 *   // hero.heading is always a string, hero.items is always an array
 */

import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrors the Hub's GeneratedContent exactly)
// ---------------------------------------------------------------------------

export interface ContentItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ContentSection {
  heading: string;
  subheading?: string;
  items?: ContentItem[];
  cta?: { text: string; subtext?: string };
}

export interface SiteContent {
  businessName: string;
  tagline: string;
  description: string;
  sections: Record<string, ContentSection>;
  meta: { title: string; description: string };
}

// ---------------------------------------------------------------------------
// Default content (safe fallback for any chassis)
// ---------------------------------------------------------------------------

const DEFAULT_CONTENT: SiteContent = {
  businessName: 'My Business',
  tagline: 'Welcome to our website',
  description: 'A professional business providing quality services.',
  sections: {},
  meta: { title: 'My Business', description: 'Welcome to our website.' },
};

const DEFAULT_SECTION: ContentSection = {
  heading: '',
  subheading: '',
  items: [],
  cta: { text: 'Learn More', subtext: '' },
};

// ---------------------------------------------------------------------------
// Normalization — ensures correct types for every field
// ---------------------------------------------------------------------------

function normalizeItem(raw: unknown): ContentItem {
  if (typeof raw !== 'object' || raw === null) {
    return { title: '', description: '' };
  }
  const obj = raw as Record<string, unknown>;
  return {
    title: typeof obj.title === 'string' ? obj.title : '',
    description: typeof obj.description === 'string' ? obj.description
      : (typeof obj.desc === 'string' ? obj.desc : ''),
    icon: typeof obj.icon === 'string' ? obj.icon : undefined,
  };
}

function normalizeSection(raw: unknown): ContentSection {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_SECTION };
  }
  const obj = raw as Record<string, unknown>;

  const section: ContentSection = {
    heading: typeof obj.heading === 'string' ? obj.heading : '',
  };

  if (typeof obj.subheading === 'string') {
    section.subheading = obj.subheading;
  }

  if (Array.isArray(obj.items)) {
    section.items = obj.items
      .filter((item) => typeof item === 'object' && item !== null)
      .map(normalizeItem);
  }

  if (typeof obj.cta === 'object' && obj.cta !== null && !Array.isArray(obj.cta)) {
    const ctaObj = obj.cta as Record<string, unknown>;
    section.cta = {
      text: typeof ctaObj.text === 'string' ? ctaObj.text : 'Learn More',
      subtext: typeof ctaObj.subtext === 'string' ? ctaObj.subtext : undefined,
    };
  } else if (typeof obj.cta === 'string') {
    section.cta = { text: obj.cta };
  }

  return section;
}

function normalizeContent(raw: unknown): SiteContent {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_CONTENT };
  }
  const obj = raw as Record<string, unknown>;

  const sections: Record<string, ContentSection> = {};
  if (typeof obj.sections === 'object' && obj.sections !== null && !Array.isArray(obj.sections)) {
    for (const [key, value] of Object.entries(obj.sections as Record<string, unknown>)) {
      sections[key] = normalizeSection(value);
    }
  }

  let meta = { title: 'My Business', description: 'Welcome to our website.' };
  if (typeof obj.meta === 'object' && obj.meta !== null) {
    const m = obj.meta as Record<string, unknown>;
    meta = {
      title: typeof m.title === 'string' ? m.title : meta.title,
      description: typeof m.description === 'string' ? m.description : meta.description,
    };
  }

  return {
    businessName: typeof obj.businessName === 'string' ? obj.businessName : DEFAULT_CONTENT.businessName,
    tagline: typeof obj.tagline === 'string' ? obj.tagline : DEFAULT_CONTENT.tagline,
    description: typeof obj.description === 'string' ? obj.description : DEFAULT_CONTENT.description,
    sections,
    meta,
  };
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

let _cache: SiteContent | null = null;
let _loading = false;
let _listeners: ((c: SiteContent) => void)[] = [];

async function loadContentFromDisk(): Promise<SiteContent> {
  if (_cache) return _cache;

  try {
    const res = await fetch('/content.json');
    if (!res.ok) {
      console.warn('[content-loader] content.json not found (status ' + res.status + '), using defaults');
      _cache = { ...DEFAULT_CONTENT };
      return _cache;
    }
    const raw = await res.json();
    _cache = normalizeContent(raw);
    return _cache;
  } catch (err) {
    console.warn('[content-loader] Failed to load content.json, using defaults:', err);
    _cache = { ...DEFAULT_CONTENT };
    return _cache;
  }
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * React hook that loads and returns normalized site content.
 *
 * Returns:
 *   content  — the full SiteContent object (always defined, never null)
 *   section  — helper to get a specific section by ID (always returns valid ContentSection)
 *   loading  — true while content.json is being fetched
 */
export function useContent() {
  const [content, setContent] = useState<SiteContent>(_cache ?? DEFAULT_CONTENT);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) {
      setContent(_cache);
      setLoading(false);
      return;
    }

    if (_loading) {
      // Another component already started loading — wait for it
      const listener = (c: SiteContent) => {
        setContent(c);
        setLoading(false);
      };
      _listeners.push(listener);
      return () => {
        _listeners = _listeners.filter((l) => l !== listener);
      };
    }

    _loading = true;
    loadContentFromDisk().then((c) => {
      setContent(c);
      setLoading(false);
      _loading = false;
      for (const l of _listeners) l(c);
      _listeners = [];
    });
  }, []);

  /** Get a section by ID — always returns a valid ContentSection, never undefined */
  function section(id: string): ContentSection {
    return content.sections[id] ?? { ...DEFAULT_SECTION };
  }

  return { content, section, loading };
}

/**
 * Non-hook version for use outside React components.
 * Returns a promise that resolves to normalized content.
 */
export async function getContent(): Promise<SiteContent> {
  return loadContentFromDisk();
}

/**
 * Safe array accessor — ensures the value is always an array.
 * Usage: safeArray(section.items).map(...)
 */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

/**
 * Safe string accessor — ensures the value is always a string.
 * Usage: safeStr(item?.title)
 */
export function safeStr(val: string | undefined | null, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}
