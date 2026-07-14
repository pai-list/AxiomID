import React from 'react';
import { render, screen } from '@testing-library/react';
import { PassportHeader } from '@/app/passport/[slug]/PassportHeader';
import { useLanguage } from '@/app/context/language-context';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode, href: string, className: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock language context
jest.mock('@/app/context/language-context', () => ({
  useLanguage: jest.fn(),
}));

// Mock LanguageToggle
jest.mock('@/components/LanguageToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="language-toggle">Toggle</div>,
}));

describe('PassportHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLanguage as jest.Mock).mockReturnValue({
      t: (key: string) => `translated_${key}`,
    });
  });

  it('renders correctly', () => {
    render(<PassportHeader />);

    // Check for logo text
    expect(screen.getByText('AXIOM')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();

    // Check for language toggle
    expect(screen.getByTestId('language-toggle')).toBeInTheDocument();

    // Check for translated text
    expect(screen.getByText('translated_agent_passport')).toBeInTheDocument();
  });

  it('has a link to the home page', () => {
    render(<PassportHeader />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });
});
