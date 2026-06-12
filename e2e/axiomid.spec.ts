import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const sandboxToken = process.env.PI_SANDBOX_ACCESS_TOKEN;
const sandboxUid = process.env.PI_SANDBOX_UID;
const sandboxUsername = process.env.PI_SANDBOX_USERNAME;
const sandboxWallet = sandboxUid ? `pi:${sandboxUid}` : undefined;
const databaseUrl = process.env.DATABASE_URL;
const hasPiSandboxAuth = Boolean(sandboxToken && sandboxUid && sandboxUsername && databaseUrl);
const SKIP_PI_SANDBOX = 'Pi sandbox credentials and DATABASE_URL are required.';

test.describe.serial('AxiomID Pi sandbox E2E', () => {
  let prisma: PrismaClient | undefined;
  let authedUser: Awaited<ReturnType<typeof authenticateWithPiSandbox>> | undefined;

  test.beforeAll(async () => {
    if (!hasPiSandboxAuth) return;
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('opens the homepage at /', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AxiomID|Human Authorization Protocol/i);
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
  });

  test('shows the Pi Browser CTA when window.Pi is available', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'Pi', {
        value: {
          init: () => undefined,
          authenticate: () => new Promise(() => undefined),
        },
        configurable: true,
      });
    });

    await page.goto('/');
    await expect(page.getByTestId('pi-browser-cta')).toContainText(/Pi Browser Ready/i);
    await expect(page.getByRole('button', { name: /connect with pi browser/i })).toBeVisible();
  });

  test('connects through Pi sandbox auth and creates a user in the dedicated test database', async ({ request }) => {
    test.skip(!hasPiSandboxAuth, 'Set PI_SANDBOX_ACCESS_TOKEN, PI_SANDBOX_UID, PI_SANDBOX_USERNAME, and DATABASE_URL to run the real Pi sandbox auth flow.');

    authedUser = await authenticateWithPiSandbox(request);
    expect(authedUser.walletAddress).toBe(sandboxWallet);
    expect(authedUser.did).toMatch(/^did:axiom:axiomid\.app:/);

    const user = await prisma!.user.findUnique({ where: { piUid: sandboxUid } });
    expect(user).toBeTruthy();
    expect(user?.walletAddress).toBe(sandboxWallet);
    expect(user?.did).toBe(authedUser.did);
  });

  test('generates a DID and displays it on /passport/[slug]', async ({ page, request }) => {
    test.skip(!hasPiSandboxAuth, SKIP_PI_SANDBOX);

    authedUser ??= await authenticateWithPiSandbox(request);
    await page.goto(`/passport/${sandboxUsername}`);
    await expect(page.getByText(authedUser.did!, { exact: false })).toBeVisible();
    await expect(page.getByText(sandboxWallet!, { exact: false })).toBeVisible();
  });

  test('enters /dashboard with persisted local state', async ({ page, request }) => {
    test.skip(!hasPiSandboxAuth, SKIP_PI_SANDBOX);

    authedUser ??= await authenticateWithPiSandbox(request);
    await seedBrowserSession(page, authedUser);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /AxiomID Dashboard/i })).toBeVisible();
    await expect(page.getByTestId('dashboard-did')).toContainText(authedUser.did!);
  });

  test('claims a real action through the API test database', async ({ request }) => {
    test.skip(!hasPiSandboxAuth, SKIP_PI_SANDBOX);

    authedUser ??= await authenticateWithPiSandbox(request);
    await prisma!.action.deleteMany({ where: { userId: authedUser.userId, type: 'daily_pow' } });

    const response = await request.post('/api/action/claim', {
      headers: { Authorization: `Bearer ${sandboxToken}` },
      data: { actionType: 'daily_pow', metadata: { source: 'playwright-e2e' } },
    });
    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.xpEarned).toBe(20);

    const action = await prisma!.action.findUnique({
      where: { user_action_unique: { userId: authedUser.userId, type: 'daily_pow' } },
    });
    expect(action).toBeTruthy();
    expect(action?.xp).toBe(20);
  });

  test('runs payment sandbox verification when a sandbox payment is supplied', async ({ request }) => {
    test.skip(!hasPiSandboxAuth, SKIP_PI_SANDBOX);
    test.skip(!process.env.PI_API_KEY || !process.env.PI_SANDBOX_PAYMENT_ID, 'Set PI_API_KEY and PI_SANDBOX_PAYMENT_ID to run payment approve; add PI_SANDBOX_PAYMENT_TXID to complete.');

    const paymentId = process.env.PI_SANDBOX_PAYMENT_ID!;
    const approve = await request.post('/api/pi/payment/approve', {
      headers: { Authorization: `Bearer ${sandboxToken}` },
      data: { paymentId },
    });
    expect(approve.ok()).toBeTruthy();

    if (!process.env.PI_SANDBOX_PAYMENT_TXID) return;

    const complete = await request.post('/api/pi/payment/complete', {
      headers: { Authorization: `Bearer ${sandboxToken}` },
      data: { paymentId, txid: process.env.PI_SANDBOX_PAYMENT_TXID },
    });
    expect(complete.ok()).toBeTruthy();
  });

  test('logs out, clears local state, and remains logged out after reload', async ({ page, request }) => {
    test.skip(!hasPiSandboxAuth, SKIP_PI_SANDBOX);

    authedUser ??= await authenticateWithPiSandbox(request);
    await seedBrowserSession(page, authedUser);
    await page.goto('/dashboard');
    await page.getByTestId('logout-button').click();

    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('axiomid_wallet'))).toBeNull();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pi_access_token'))).toBeNull();

    await page.reload();
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
  });
});

async function authenticateWithPiSandbox(request: APIRequestContext) {
  const response = await request.post('/api/auth/pi', {
    data: {
      accessToken: sandboxToken,
      uid: sandboxUid,
      username: sandboxUsername,
      walletAddress: sandboxWallet,
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{
    userId: string;
    walletAddress: string;
    piUid: string;
    piUsername: string;
    tier: string;
    xp: number;
    did: string | null;
  }>;
}

async function seedBrowserSession(page: Page, user: { walletAddress: string }) {
  await page.addInitScript(
    ({ walletAddress, token }) => {
      localStorage.setItem('axiomid_wallet', walletAddress);
      localStorage.setItem('pi_access_token', token);
    },
    { walletAddress: user.walletAddress, token: sandboxToken! },
  );
}
