import type { ChassisConfig } from './types';

export async function loadChassis(id: string): Promise<ChassisConfig> {
  const mod = await import(`./${id}/chassis.json`);
  return mod.default as ChassisConfig;
}

export async function loadContent(chassisId: string): Promise<Record<string, unknown>> {
  const mod = await import(`./${chassisId}/content.json`);
  return mod.default as Record<string, unknown>;
}

export const CHASSIS_REGISTRY: { id: string; name: string; keywords: string[]; description: string }[] = [
  { id: 'local-service', name: 'Local Service Business', keywords: ['plumber', 'electrician', 'hvac', 'contractor', 'handyman', 'cleaning', 'landscaping', 'pest control', 'locksmith', 'painter', 'roofing', 'moving'], description: 'Service businesses that operate locally' },
  { id: 'restaurant', name: 'Restaurant & Food', keywords: ['restaurant', 'cafe', 'bakery', 'pizza', 'sushi', 'bar', 'coffee', 'catering', 'food truck', 'brewery', 'winery', 'deli'], description: 'Food and beverage businesses' },
  { id: 'portfolio', name: 'Portfolio & Creative', keywords: ['portfolio', 'photographer', 'designer', 'artist', 'freelancer', 'writer', 'illustrator', 'videographer', 'musician', 'architect'], description: 'Creative professionals showcasing work' },
  { id: 'professional', name: 'Professional Services', keywords: ['lawyer', 'accountant', 'consultant', 'therapist', 'dentist', 'doctor', 'veterinarian', 'financial advisor', 'insurance', 'real estate agent'], description: 'Licensed professionals and firms' },
  { id: 'saas-landing', name: 'SaaS & Product', keywords: ['saas', 'app', 'software', 'startup', 'product', 'tool', 'platform', 'api', 'service', 'subscription'], description: 'Software products and digital services' },
  { id: 'nonprofit', name: 'Nonprofit & Community', keywords: ['nonprofit', 'charity', 'church', 'school', 'community', 'volunteer', 'foundation', 'association', 'club', 'organization'], description: 'Mission-driven organizations' },
  { id: 'event', name: 'Event & Venue', keywords: ['wedding', 'event', 'conference', 'venue', 'party', 'festival', 'concert', 'retreat', 'workshop', 'seminar'], description: 'Events, venues, and gatherings' },
  { id: 'ecommerce', name: 'E-Commerce & Shop', keywords: ['shop', 'store', 'boutique', 'retail', 'handmade', 'jewelry', 'clothing', 'gifts', 'crafts', 'marketplace'], description: 'Online and local retail' },
  { id: 'real-estate', name: 'Real Estate & Property', keywords: ['real estate', 'realtor', 'property', 'rental', 'apartment', 'house', 'condo', 'broker', 'listing', 'airbnb'], description: 'Property listings and real estate services' },
  { id: 'fitness', name: 'Fitness & Wellness', keywords: ['gym', 'yoga', 'fitness', 'personal trainer', 'spa', 'massage', 'pilates', 'crossfit', 'martial arts', 'wellness', 'nutrition', 'meditation'], description: 'Health, fitness, and wellness businesses' },
];

export type { ChassisConfig, SectionConfig, ContentField, AxisOption } from './types';
