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
