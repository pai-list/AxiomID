import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PassportView } from '@/app/passport/[slug]/PassportView';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/app/context/language-context';
import { sharePassport } from '@/lib/pi-native-features';

function TestWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/app/context/language-context', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('@/lib/pi-native-features', () => ({
  sharePassport: jest.fn(),
}));

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

const mockTranslate = jest.fn((key: string) => key);

describe('PassportView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'test-slug' });
    (useLanguage as jest.Mock).mockReturnValue({ t: mockTranslate });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading skeleton initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<PassportView />, { wrapper: TestWrapper });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('renders passport data on successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPassportData,
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId('agent-passport')).toBeInTheDocument();
    });

    expect(screen.getByTestId('ap-username')).toHaveTextContent('testuser');
    expect(screen.getByTestId('ap-did')).toHaveTextContent('did:pi:123');
    expect(screen.getByTestId('ap-tier')).toHaveTextContent('Citizen');
    expect(screen.getByTestId('agent-qr')).toBeInTheDocument();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders error state on fetch failure (network error)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('passport_not_found')).toBeInTheDocument();
    });

    expect(screen.getByText('Network failure')).toBeInTheDocument();
    expect(screen.getByText('create_your_passport')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('renders error state on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Custom API Error' }),
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('passport_not_found')).toBeInTheDocument();
    });

    expect(screen.getByText('Custom API Error')).toBeInTheDocument();
  });

  it('handles share button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPassportData,
    });

    const user = userEvent.setup();
    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('share_passport')).toBeInTheDocument();
    });

    await user.click(screen.getByText('share_passport'));

    expect(sharePassport).toHaveBeenCalledWith({
      title: 'share_title',
      text: 'share_text',
      url: window.location.href,
    });
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('passport_not_found')).toBeInTheDocument();
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

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => minData,
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId('agent-passport')).toBeInTheDocument();
    });
  });

  it('falls back to default error message if json throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error('Parse error'); },
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('passport_not_found')).toBeInTheDocument();
    });
  });

  it('renders an error state when a successful response body fails to parse as JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token')),
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Unexpected token')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('handles non-Error fetch rejections gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('passport_not_found')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('does nothing if slug is missing', () => {
    (useParams as jest.Mock).mockReturnValue({ slug: undefined });

    render(<PassportView />, { wrapper: TestWrapper });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('does not fetch when slug is an empty string', () => {
    (useParams as jest.Mock).mockReturnValue({ slug: '' });

    render(<PassportView />, { wrapper: TestWrapper });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders the "preparing" screen with the job status while the identity is still building', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockPassportData, jobStatus: 'PROVISIONING' }),
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Preparing your AI...')).toBeInTheDocument();
    });

    expect(screen.getByText(/Status: PROVISIONING/)).toBeInTheDocument();
    expect(screen.queryByTestId('agent-passport')).not.toBeInTheDocument();
  });

  it('renders the full passport view when jobStatus is ACTIVE', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockPassportData, jobStatus: 'ACTIVE' }),
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId('agent-passport')).toBeInTheDocument();
    });

    expect(screen.queryByText('Preparing your AI...')).not.toBeInTheDocument();
  });

  it('renders the full passport view when jobStatus is COMPLETED', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockPassportData, jobStatus: 'COMPLETED' }),
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId('agent-passport')).toBeInTheDocument();
    });

    expect(screen.queryByText('Preparing your AI...')).not.toBeInTheDocument();
  });

  it('does not throw when fetch resolves after unmount', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    const { unmount } = render(<PassportView />, { wrapper: TestWrapper });
    unmount();

    await act(async () => {
      resolveFetch({ ok: true, json: async () => mockPassportData });
      await Promise.resolve();
    });
  });

  it('calls the passport API with a URL-encoded slug', async () => {
    (useParams as jest.Mock).mockReturnValue({ slug: 'name/with special?chars' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPassportData,
    });

    render(<PassportView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`/api/passport/${encodeURIComponent('name/with special?chars')}`);
  });
});
