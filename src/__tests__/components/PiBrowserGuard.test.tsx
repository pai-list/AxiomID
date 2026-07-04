import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { PiBrowserBanner, PiBrowserGuard } from '@/components/PiBrowserGuard';
import { useLanguage } from '@/app/context/language-context';

// Mock framer motion to just render children immediately
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/lib/pi-sdk', () => ({
  checkPiBrowser: jest.fn(),
  determineSandboxMode: jest.fn()
}));

import { checkPiBrowser, determineSandboxMode } from '@/lib/pi-sdk';

const mockCheckPiBrowser = checkPiBrowser as jest.Mock;
const mockDetermineSandboxMode = determineSandboxMode as jest.Mock;
const mockUseLanguage = useLanguage as jest.Mock;

describe('PiBrowserBanner', () => {
  beforeEach(() => {
    mockCheckPiBrowser.mockReset();
    mockDetermineSandboxMode.mockReset();
    mockUseLanguage.mockReset();

    mockUseLanguage.mockReturnValue({
      language: 'en',
    });
  });

  const renderWithGuard = async (isPiBrowser: boolean, isSandbox: boolean) => {
    mockCheckPiBrowser.mockReturnValue(isPiBrowser);
    mockDetermineSandboxMode.mockReturnValue(isSandbox);

    jest.useFakeTimers();

    let result: ReturnType<typeof render>;

    act(() => {
      result = render(
        <PiBrowserGuard showSplash={false}>
          <PiBrowserBanner />
        </PiBrowserGuard>
      );
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    return result;
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders null when not in PiBrowser', async () => {
    await renderWithGuard(false, false);
    expect(screen.queryByText(/Pi Browser/)).not.toBeInTheDocument();
  });

  describe('English locale', () => {
    it('renders Pi Browser text when in PiBrowser and not sandbox', async () => {
      await renderWithGuard(true, false);
      expect(screen.getByText(/Pi Browser/)).toBeInTheDocument();
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
      expect(screen.getByText(/Full functionality available/)).toBeInTheDocument();
    });

    it('renders Pi Sandbox text when in PiBrowser and sandbox', async () => {
      await renderWithGuard(true, true);
      expect(screen.getByText(/Pi Sandbox/)).toBeInTheDocument();
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
      expect(screen.getByText(/Full functionality available/)).toBeInTheDocument();
    });
  });

  describe('Arabic locale', () => {
    beforeEach(() => {
      mockUseLanguage.mockReturnValue({
        language: 'ar',
      });
    });

    it('renders Pi Browser text in Arabic when in PiBrowser and not sandbox', async () => {
      await renderWithGuard(true, false);
      expect(screen.getByText(/Pi Browser/)).toBeInTheDocument();
      expect(screen.getByText(/متصل/)).toBeInTheDocument();
      expect(screen.getByText(/جميع الوظائف متاحة/)).toBeInTheDocument();
    });

    it('renders Pi Sandbox text in Arabic when in PiBrowser and sandbox', async () => {
      await renderWithGuard(true, true);
      expect(screen.getByText(/Pi Sandbox/)).toBeInTheDocument();
      expect(screen.getByText(/متصل/)).toBeInTheDocument();
      expect(screen.getByText(/جميع الوظائف متاحة/)).toBeInTheDocument();
    });
  });
});
