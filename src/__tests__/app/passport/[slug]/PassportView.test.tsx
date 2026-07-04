import { act } from "@testing-library/react";
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassportView } from '@/app/passport/[slug]/PassportView';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/app/context/language-context';
import { sharePassport } from '@/lib/pi-native-features';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock language context
jest.mock('@/app/context/language-context', () => ({
  useLanguage: jest.fn(),
}));

// Mock pi-native-features
jest.mock('@/lib/pi-native-features', () => ({
  sharePassport: jest.fn(),
}));

// Mock child components
jest.mock('@/components/AgentPassport', () => ({
  AgentPassport: (props: { username: string; did: string; tier: string }) => (
    <div data-testid="agent-passport">
      <span data-testid="ap-username">{props.username}</span>
      <span data-testid="ap-did">{props.did}</span>
      <span data-testid="ap-tier">{props.tier}</span>
    </div>
  ),
}));

jest.mock('@/components/AgentQR', () => ({
  AgentQR: (props: { did: string }) => <div data-testid="agent-qr" data-did={props.did} />,
}));

const mockPassportData = {
  username: 'testuser',
  walletAddress: '0x123',
  stellarAddress: 'G123',
  did: 'did:pi:123',
  tier: 'Citizen',
  xp: 100,
  trustScore: 85,
  kyaStatus: 'verified',
  kycStatus: 'verified',
  stamps: [],
  issuedDate: '2023-01-01',
  agentName: 'Test Agent',
  agentStatus: 'ACTIVE',
};

const mockTranslate = jest.fn((key: string) => `translated_${key}`);

describe('PassportView', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (useParams as jest.Mock).mockReturnValue({ slug: 'test-slug' });
    (useLanguage as jest.Mock).mockReturnValue({ t: mockTranslate });

    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    // Make fetch hang forever to check loading state
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { container } = render(<PassportView />);

    // Check for the skeleton loader
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('renders passport data on successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPassportData,
    });

    render(<PassportView />);

    await waitFor(() => {
      expect(screen.getByTestId('agent-passport')).toBeInTheDocument();
    });

    expect(screen.getByTestId('ap-username')).toHaveTextContent('testuser');
    expect(screen.getByTestId('ap-did')).toHaveTextContent('did:pi:123');
    expect(screen.getByTestId('ap-tier')).toHaveTextContent('Citizen');
    expect(screen.getByTestId('agent-qr')).toBeInTheDocument();

    // Loading skeleton should be gone
    const loadingSkeleton = document.querySelector('.animate-pulse');
    expect(loadingSkeleton).not.toBeInTheDocument();
  });

  it('renders error state on fetch failure (network error)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    render(<PassportView />);

    await waitFor(() => {
      expect(screen.getAllByText('translated_passport_not_found')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('Network failure')).toBeInTheDocument();
    expect(screen.getByText('translated_create_your_passport')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('renders error state on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Custom API Error' }),
    });

    render(<PassportView />);

    await waitFor(() => {
      expect(screen.getAllByText('translated_passport_not_found')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('Custom API Error')).toBeInTheDocument();
  });

  it('handles share button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPassportData,
    });

    const user = userEvent.setup();
    render(<PassportView />);

    await waitFor(() => {
      expect(screen.getByText('translated_share_passport')).toBeInTheDocument();
    });

    await user.click(screen.getByText('translated_share_passport'));

    expect(sharePassport).toHaveBeenCalledWith({
      title: 'translated_share_title',
      text: 'translated_share_text',
      url: window.location.href, // just pass what it actually is in jsdom
    });
  });


  it('ignores abort errors during fetch', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    render(<PassportView />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // We expect NO state updates to happen, so it stays loading
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });


  it('renders nothing when there is no loading, no error, and no passport', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => null, // empty data
    });

    const { container } = render(<PassportView />);

    await waitFor(() => {
      // should have nothing
      expect(container.firstChild).toBeNull();
    });
  });


  it('renders passport data without optional fields', async () => {
    const minData = {
      username: 'testuser',
      walletAddress: null,
      did: 'did:pi:123',
      tier: 'Citizen',
      xp: 100,
      trustScore: 85,
      kyaStatus: 'verified',
      kycStatus: 'verified',
      issuedDate: '2023-01-01',
      agentName: null,
      agentStatus: null,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => minData,
    });

    render(<PassportView />);

    await waitFor(() => {
      expect(screen.getByTestId('agent-passport')).toBeInTheDocument();
    });
  });


  it('falls back to default error message if json throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error('Parse error'); },
    });

    render(<PassportView />);

    await waitFor(() => {
      expect(screen.getAllByText('translated_passport_not_found')[0]).toBeInTheDocument();
    });

    // It should use the fallback message from t('passport_not_found')
    const errorElements = screen.getAllByText('translated_passport_not_found');
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('uses generic fallback message if fetch error is not an Error instance', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error, not Error object');

    render(<PassportView />);

    await waitFor(() => {
      expect(screen.getAllByText('translated_passport_not_found')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('translated_passport_load_error')).toBeInTheDocument();
  });

  it('aborts fetch on unmount', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { unmount } = render(<PassportView />);

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  it('does not throw or update state when the fetch resolves after unmount', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    const { unmount } = render(<PassportView />);
    unmount();

    // Resolving the in-flight fetch after unmount should not throw, even
    // though the component's cleanup already aborted the request.
    await act(async () => {
      resolveFetch({ ok: true, json: async () => mockPassportData });
      await Promise.resolve();
    });
  });

  it('calls the passport API with a URL-encoded slug and an abort signal', async () => {
    (useParams as jest.Mock).mockReturnValue({ slug: 'name/with special?chars' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPassportData,
    });

    render(<PassportView />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`/api/passport/${encodeURIComponent('name/with special?chars')}`);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('does nothing if slug is missing', () => {
    (useParams as jest.Mock).mockReturnValue({ slug: undefined });

    render(<PassportView />);

    expect(global.fetch).not.toHaveBeenCalled();
    // Loading state (set on initial render) is never resolved since the
    // effect bails out early, so the skeleton should remain visible.
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('does not fetch when slug is an empty string', () => {
    (useParams as jest.Mock).mockReturnValue({ slug: '' });

    render(<PassportView />);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
