/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { DevModeBanner } from '@/components/DevModeBanner';

const mockSetLanguage = jest.fn();
const mockT = jest.fn((k: string) => k);

jest.mock('@/app/context/language-context', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: mockSetLanguage,
    t: mockT,
  }),
}));

jest.mock('@/lib/pi-sdk', () => ({
  determineSandboxMode: jest.fn(),
}));

import { determineSandboxMode } from '@/lib/pi-sdk';
const mockDetermineSandbox = determineSandboxMode as jest.Mock;

function flushTimer() {
  return act(() => {
    jest.advanceTimersByTime(1);
  });
}

describe('DevModeBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders nothing when not in sandbox mode', async () => {
    mockDetermineSandbox.mockReturnValue(false);
    render(<DevModeBanner />);
    await flushTimer();
    expect(screen.queryByText(/DEV MODE/)).not.toBeInTheDocument();
  });

  it('renders red banner when in sandbox mode', async () => {
    mockDetermineSandbox.mockReturnValue(true);
    render(<DevModeBanner />);
    await flushTimer();
    expect(screen.getByText(/DEV MODE/)).toBeInTheDocument();
  });

  it('shows warning text about Pi Network', async () => {
    mockDetermineSandbox.mockReturnValue(true);
    render(<DevModeBanner />);
    await flushTimer();
    expect(screen.getByText(/Not connected to Pi Network/)).toBeInTheDocument();
  });
});