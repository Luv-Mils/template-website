import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, Navbar, Footer } from './shared/foundation';
import { resolveConfig } from './config/template';
import { getTheme, getTypography } from './config/theme';
import { buildLayout } from './config/layouts';
import { loadChassis } from './chassis';
import { getContent } from './lib/content-loader';
import type { ChassisConfig } from './chassis/types';
import type { LayoutDef } from './config/layouts';

// ---------------------------------------------------------------------------
// Lazy component map — only the components a chassis needs get loaded
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
const COMPONENT_MAP: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  // Content
  HeroSection: () => import('./shared/content/HeroSection'),
  ServicesGrid: () => import('./shared/content/ServicesGrid'),
  MediaGallery: () => import('./shared/content/MediaGallery'),
  TestimonialsCarousel: () => import('./shared/content/TestimonialsCarousel'),
  FAQAccordion: () => import('./shared/content/FAQAccordion'),
  PricingTable: () => import('./shared/content/PricingTable'),
  BlogList: () => import('./shared/content/BlogList'),
  StatsCounter: () => import('./shared/content/StatsCounter'),
  TimelineDisplay: () => import('./shared/content/TimelineDisplay'),
  TeamGrid: () => import('./shared/content/TeamGrid'),
  CTABanner: () => import('./shared/content/CTABanner'),
  CountdownTimer: () => import('./shared/content/CountdownTimer'),
  MapIntegration: () => import('./shared/content/MapIntegration'),
  // Communication
  ContactForm: () => import('./shared/communication/ContactForm'),
  SocialShareBar: () => import('./shared/communication/SocialShareBar'),
  RSVPForm: () => import('./shared/communication/RSVPForm'),
  // Scheduling
  BookingFlow: () => import('./shared/scheduling/BookingFlow'),
};

// ---------------------------------------------------------------------------
// Default handlers for interactive components (can't live in JSON)
// ---------------------------------------------------------------------------

const DEFAULT_HANDLERS: Record<string, Record<string, unknown>> = {
  contact: {
    onSubmit: async () => {
      alert('Thank you! We\'ll be in touch soon.');
    },
  },
  booking: {
    onComplete: () => {
      alert('Booking confirmed! Check your email for details.');
    },
  },
  rsvp: {
    onSubmit: () => {
      alert('Thank you for your RSVP!');
    },
  },
};

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function SectionRenderer({
  sectionId,
  component,
  content,
  components,
}: {
  sectionId: string;
  component: string;
  content: Record<string, unknown>;
  components: Record<string, React.ComponentType<{ config: any }>>;
}) {
  const Component = components[component];
  if (!Component) return null;

  const config = { ...content, ...DEFAULT_HANDLERS[sectionId] };

  return (
    <section id={sectionId}>
      <Component config={config} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page component (renders a list of sections)
// ---------------------------------------------------------------------------

function Page({
  sectionIds,
  chassis,
  content,
  components,
}: {
  sectionIds: string[];
  chassis: ChassisConfig;
  content: Record<string, unknown>;
  components: Record<string, React.ComponentType<{ config: any }>>;
}) {
  return (
    <>
      {sectionIds.map((id) => {
        const section = chassis.sections.find((s) => s.id === id);
        if (!section) return null;
        const sectionContent = (content[section.contentKey] as Record<string, unknown>) || {};
        return (
          <SectionRenderer
            key={id}
            sectionId={id}
            component={section.component}
            content={sectionContent}
            components={components}
          />
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Multi-page shell
// ---------------------------------------------------------------------------

function MultiPageApp({
  layout,
  chassis,
  content,
  components,
}: {
  layout: LayoutDef;
  chassis: ChassisConfig;
  content: Record<string, unknown>;
  components: Record<string, React.ComponentType<{ config: any }>>;
}) {
  const navContent = content.nav as any;
  const footerContent = content.footer as any;

  const navLinks = (layout.pages || [])
    .filter((p) => p.path !== '/')
    .map((p) => ({ label: p.name, href: p.path }));

  const navConfig = {
    brand: { name: navContent?.brand?.name || chassis.name },
    links: navLinks,
    cta: navContent?.cta,
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground font-body">
        <Navbar config={navConfig} />
        <main>
          <Routes>
            {(layout.pages || []).map((page) => (
              <Route
                key={page.path}
                path={page.path}
                element={
                  <Page
                    sectionIds={page.sections}
                    chassis={chassis}
                    content={content}
                    components={components}
                  />
                }
              />
            ))}
          </Routes>
        </main>
        {footerContent && <Footer config={footerContent} />}
      </div>
    </BrowserRouter>
  );
}

// ---------------------------------------------------------------------------
// Single-page shell
// ---------------------------------------------------------------------------

function SinglePageApp({
  layout,
  chassis,
  content,
  components,
  isMinimal,
}: {
  layout: LayoutDef;
  chassis: ChassisConfig;
  content: Record<string, unknown>;
  components: Record<string, React.ComponentType<{ config: any }>>;
  isMinimal: boolean;
}) {
  const navContent = content.nav as any;
  const footerContent = content.footer as any;
  const sectionIds = layout.sections || [];

  const navLinks = sectionIds
    .filter((id) => !['hero', 'cta', 'social'].includes(id))
    .slice(0, 5)
    .map((id) => ({
      label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
      href: `#${id}`,
    }));

  const navConfig = {
    brand: { name: navContent?.brand?.name || chassis.name },
    links: navContent?.links || navLinks,
    cta: navContent?.cta,
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Navbar config={navConfig} />
      <main className={isMinimal ? 'space-y-16' : ''}>
        <Page
          sectionIds={sectionIds}
          chassis={chassis}
          content={content}
          components={components}
        />
      </main>
      {footerContent && <Footer config={footerContent} />}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// App — the universal chassis renderer
// ---------------------------------------------------------------------------

export default function App() {
  const [state, setState] = useState<{
    chassis: ChassisConfig;
    content: Record<string, unknown>;
    components: Record<string, React.ComponentType<{ config: any }>>;
    layout: LayoutDef;
    theme: any;
    typography: any;
  } | null>(null);

  useEffect(() => {
    async function init() {
      const vibeConfig = resolveConfig();
      const chassisConfig = await loadChassis(vibeConfig.chassis);

      // Load AI-generated content from /content.json (with defensive fallbacks).
      // getContent() normalizes every field and returns DEFAULT_CONTENT if the
      // file is missing, so the app always renders — even without AI content.
      const siteContent = await getContent();

      // Flatten SiteContent into the component-expected flat content map.
      // Components receive content[section.contentKey] as their config prop.
      const content: Record<string, unknown> = {};

      for (const [key, section] of Object.entries(siteContent.sections)) {
        content[key] = section;
      }

      // Build nav content from site metadata
      content.nav = {
        brand: { name: siteContent.businessName || chassisConfig.name },
      };

      // Build footer content from site metadata
      content.footer = {
        brand: { name: siteContent.businessName || chassisConfig.name },
        tagline: siteContent.tagline,
      };

      // Set document title from AI-generated meta
      if (siteContent.meta?.title && siteContent.meta.title !== 'My Business') {
        document.title = siteContent.meta.title;
      }

      // Apply vibe.config content overrides (query param overrides)
      if (vibeConfig.content) {
        for (const [key, val] of Object.entries(vibeConfig.content)) {
          if (typeof val === 'object' && val !== null && typeof content[key] === 'object') {
            content[key] = { ...(content[key] as object), ...(val as object) };
          } else {
            content[key] = val;
          }
        }
      }

      // Build layout from axis selection + chassis sections
      const layoutDef = buildLayout(vibeConfig.layout, chassisConfig.sections);

      // Resolve theme + typography
      const theme = getTheme(vibeConfig.theme);
      const typography = getTypography(vibeConfig.typography);

      // Lazy-load only the components this chassis needs
      const needed = new Set(chassisConfig.sections.map((s) => s.component));
      const loaded: Record<string, React.ComponentType<{ config: any }>> = {};
      const loadPromises = Array.from(needed).map(async (name) => {
        const loader = COMPONENT_MAP[name];
        if (loader) {
          const mod = await loader();
          loaded[name] = mod.default;
        }
      });
      await Promise.all(loadPromises);

      setState({ chassis: chassisConfig, content, components: loaded, layout: layoutDef, theme, typography });
    }

    init();
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0D1A' }}>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const { chassis, content, components, layout, theme, typography } = state;

  return (
    <ThemeProvider theme={theme} typography={typography}>
      {layout.type === 'multiPage' ? (
        <MultiPageApp layout={layout} chassis={chassis} content={content} components={components} />
      ) : (
        <SinglePageApp
          layout={layout}
          chassis={chassis}
          content={content}
          components={components}
          isMinimal={layout.id === 'minimal'}
        />
      )}
    </ThemeProvider>
  );
}
