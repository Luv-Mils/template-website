export interface PageDef {
  path: string;
  name: string;
  sections: string[];
}

export interface LayoutDef {
  id: string;
  type: 'singlePage' | 'multiPage';
  sections?: string[];
  pages?: PageDef[];
}

/**
 * Build a LayoutDef from a layout axis ID + chassis sections.
 *
 * - single-page: all sections on one scrollable page
 * - multi-page: sections split across pages using the `page` field on each section
 * - minimal: same as single-page but only required sections
 */
export function buildLayout(
  layoutId: string,
  sections: Array<{ id: string; required: boolean; page?: string }>,
): LayoutDef {
  if (layoutId === 'minimal') {
    return {
      id: 'minimal',
      type: 'singlePage',
      sections: sections.filter(s => s.required).map(s => s.id),
    };
  }

  if (layoutId === 'multi-page') {
    const pageMap = new Map<string, string[]>();
    for (const s of sections) {
      const page = s.page || 'home';
      if (!pageMap.has(page)) pageMap.set(page, []);
      pageMap.get(page)!.push(s.id);
    }

    const pageNames: Record<string, string> = {
      home: 'Home',
      about: 'About',
      services: 'Services',
      contact: 'Contact',
      menu: 'Menu',
      gallery: 'Gallery',
      pricing: 'Pricing',
      team: 'Team',
      work: 'Work',
      listings: 'Listings',
      classes: 'Classes',
      programs: 'Programs',
      products: 'Products',
      events: 'Events',
    };

    const pages: PageDef[] = [];
    for (const [key, sectionIds] of pageMap) {
      pages.push({
        path: key === 'home' ? '/' : `/${key}`,
        name: pageNames[key] || key.charAt(0).toUpperCase() + key.slice(1),
        sections: sectionIds,
      });
    }

    return { id: 'multi-page', type: 'multiPage', pages };
  }

  // Default: single-page
  return {
    id: 'single-page',
    type: 'singlePage',
    sections: sections.map(s => s.id),
  };
}
