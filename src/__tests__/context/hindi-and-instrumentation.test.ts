jest.unmock('@/app/context/language-context');

import fs from 'node:fs';
import path from 'node:path';
import { getTranslation, getTranslations } from '@/i18n';
import enJson from '@/i18n/en.json';
import hiJson from '@/i18n/hi.json';
import { LOCALES, LOCALES_LIST, ROUTE_TRANSLATIONS } from '@/lib/i18n/config';
import { SUPPORTED_LOCALES, t as libT, getDir } from '@/lib/i18n/translations';

describe('Quad-lingual Hindi (hi) i18n and Sentry router cleanup', () => {
  it('provides full key parity between en.json and hi.json', () => {
    const enKeys = Object.keys(enJson);
    const hiKeys = Object.keys(hiJson);
    expect(hiKeys).toEqual(enKeys);
    expect(getTranslations('hi').dashboard_title).toBe(hiJson.dashboard_title);
    expect(getTranslation('hi', 'dashboard_title')).not.toBe(enJson.dashboard_title);
  });

  it('registers Hindi in lib/i18n/config and lib/i18n/translations', () => {
    expect(LOCALES_LIST).toEqual(['en', 'ar', 'zh', 'hi']);
    expect(LOCALES.hi).toEqual({ name: 'Hindi', native: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' });
    expect(ROUTE_TRANSLATIONS.hi.docs).toBeTruthy();
    expect(SUPPORTED_LOCALES).toEqual(['en', 'ar', 'zh', 'hi']);
    expect(libT('hi', 'heroTitle')).toBeTruthy();
    expect(libT('hi', 'heroTitle')).not.toBe(libT('en', 'heroTitle'));
    expect(getDir('hi')).toBe('ltr');
  });

  it('removes duplicate comment and any casts on window.axiomid in language-context.tsx', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../app/context/language-context.tsx'),
      'utf-8',
    );
    expect(source).not.toMatch(/\/\/ Translation function\s*\n\s*\/\/ Translation function/);
    expect(source).not.toContain('(window as any).axiomid');
    expect(source).toContain('interface AxiomIdLanguageApi');
    expect(source).toContain('hi-IN');
  });

  it('exports onRouterTransitionStart from instrumentation-client.ts', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../instrumentation-client.ts'),
      'utf-8',
    );
    expect(source).toContain('export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;');
  });
});
