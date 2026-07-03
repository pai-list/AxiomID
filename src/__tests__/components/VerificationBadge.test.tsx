import React from 'react';
import { render, screen } from '@testing-library/react';
import { VerificationBadge } from '@/components/VerificationBadge';

describe('VerificationBadge', () => {
  it('renders verified kya badge correctly', () => {
    render(<VerificationBadge type="kya" status="verified" />);
    expect(screen.getByText('KYA')).toBeInTheDocument();
    expect(screen.getByText('status_verified')).toBeInTheDocument();
  });

  it('renders pending kyc badge correctly', () => {
    render(<VerificationBadge type="kyc" status="pending" />);
    expect(screen.getByText('KYC')).toBeInTheDocument();
    expect(screen.getByText('status_pending')).toBeInTheDocument();
  });

  it('renders denied kya badge correctly', () => {
    render(<VerificationBadge type="kya" status="denied" />);
    expect(screen.getByText('KYA')).toBeInTheDocument();
    expect(screen.getByText('status_denied')).toBeInTheDocument();
  });

  it('has correct badge class for verified status', () => {
    const { container } = render(<VerificationBadge type="kyc" status="verified" />);
    expect(container.firstChild).toHaveClass('badge', 'badge-verified');
  });

  it('has correct badge class for pending status', () => {
    const { container } = render(<VerificationBadge type="kyc" status="pending" />);
    expect(container.firstChild).toHaveClass('badge', 'badge-pending');
  });

  it('has correct badge class for denied status', () => {
    const { container } = render(<VerificationBadge type="kyc" status="denied" />);
    expect(container.firstChild).toHaveClass('badge', 'badge-denied');
  });
});

describe('VerificationBadge — kya type badge classes', () => {
  it('has correct badge class for verified kya status', () => {
    const { container } = render(<VerificationBadge type="kya" status="verified" />);
    expect(container.firstChild).toHaveClass('badge', 'badge-verified');
  });

  it('has correct badge class for pending kya status', () => {
    const { container } = render(<VerificationBadge type="kya" status="pending" />);
    expect(container.firstChild).toHaveClass('badge', 'badge-pending');
  });

  it('has correct badge class for denied kya status', () => {
    const { container } = render(<VerificationBadge type="kya" status="denied" />);
    expect(container.firstChild).toHaveClass('badge', 'badge-denied');
  });
});

describe('VerificationBadge — status icon', () => {
  it('renders an svg icon with the expected size classes', () => {
    const { container } = render(<VerificationBadge type="kya" status="verified" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-3', 'h-3');
  });

  it('renders a checkmark path for the verified status', () => {
    const { container } = render(<VerificationBadge type="kya" status="verified" />);
    const path = container.querySelector('svg path');
    expect(path?.getAttribute('d')).toBe('M5 13l4 4L19 7');
  });

  it('renders a clock path for the pending status', () => {
    const { container } = render(<VerificationBadge type="kya" status="pending" />);
    const path = container.querySelector('svg path');
    expect(path?.getAttribute('d')).toBe('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z');
  });

  it('renders an X mark path for the denied status', () => {
    const { container } = render(<VerificationBadge type="kya" status="denied" />);
    const path = container.querySelector('svg path');
    expect(path?.getAttribute('d')).toBe('M6 18L18 6M6 6l12 12');
  });

  it('renders exactly one icon per badge', () => {
    const { container } = render(<VerificationBadge type="kyc" status="verified" />);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});

describe('VerificationBadge — label styling', () => {
  it('applies the opacity-60 class to the status label span', () => {
    render(<VerificationBadge type="kyc" status="verified" />);
    const statusLabel = screen.getByText('status_verified');
    expect(statusLabel).toHaveClass('opacity-60');
  });

  it('renders the type label and status label as separate elements', () => {
    render(<VerificationBadge type="kya" status="pending" />);
    const typeLabel = screen.getByText('KYA');
    const statusLabel = screen.getByText('status_pending');
    expect(typeLabel).not.toBe(statusLabel);
  });
});

describe('VerificationBadge — combinations matrix', () => {
  it.each([
    ['kya', 'verified', 'KYA', 'status_verified'],
    ['kya', 'pending', 'KYA', 'status_pending'],
    ['kya', 'denied', 'KYA', 'status_denied'],
    ['kyc', 'verified', 'KYC', 'status_verified'],
    ['kyc', 'pending', 'KYC', 'status_pending'],
    ['kyc', 'denied', 'KYC', 'status_denied'],
  ] as const)(
    'renders type=%s status=%s with label %s and status text %s without crashing',
    (type, status, expectedTypeLabel, expectedStatusText) => {
      expect(() => render(<VerificationBadge type={type} status={status} />)).not.toThrow();
      expect(screen.getByText(expectedTypeLabel)).toBeInTheDocument();
      expect(screen.getByText(expectedStatusText)).toBeInTheDocument();
    }
  );
});
