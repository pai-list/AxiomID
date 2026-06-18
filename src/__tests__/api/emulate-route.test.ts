/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock @emulators/adapter-next before importing the route
const mockGet = jest.fn(() => new Response("ok"));
const mockPost = jest.fn(() => new Response("ok"));
const mockPut = jest.fn(() => new Response("ok"));
const mockPatch = jest.fn(() => new Response("ok"));
const mockDelete = jest.fn(() => new Response("ok"));

const mockCreateEmulateHandler = jest.fn(() => ({
  GET: mockGet,
  POST: mockPost,
  PUT: mockPut,
  PATCH: mockPatch,
  DELETE: mockDelete,
}));

jest.mock("@emulators/adapter-next", () => ({
  createEmulateHandler: mockCreateEmulateHandler,
}));

jest.mock("@emulators/github", () => ({
  __emulatorName: "github",
  handleRequest: jest.fn(),
}));

async function triggerRouteHandler(route: any, method: string = "GET") {
  const req = new NextRequest(`https://axiomid.app/api/emulate/github`);
  const ctx = { params: Promise.resolve({ path: ["github"] }) };
  if (method === "GET") await route.GET(req, ctx);
  else if (method === "POST") await route.POST(req, ctx);
  else if (method === "PUT") await route.PUT(req, ctx);
  else if (method === "PATCH") await route.PATCH(req, ctx);
  else if (method === "DELETE") await route.DELETE(req, ctx);
}

describe("emulate route — handler exports", () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateEmulateHandler.mockClear();
    delete process.env.NEXT_PUBLIC_EMULATE_GITHUB;
    // The emulator is now off by default; opt in so these tests exercise the
    // enabled (createEmulateHandler) path.
    process.env.EMULATE_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.EMULATE_ENABLED;
  });

  it("exports GET handler", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    expect(route.GET).toBeDefined();
  });

  it("exports POST handler", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    expect(route.POST).toBeDefined();
  });

  it("exports PUT handler", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    expect(route.PUT).toBeDefined();
  });

  it("exports PATCH handler", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    expect(route.PATCH).toBeDefined();
  });

  it("exports DELETE handler", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    expect(route.DELETE).toBeDefined();
  });

  it("calls createEmulateHandler exactly once on first request dispatch", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    expect(mockCreateEmulateHandler).toHaveBeenCalledTimes(0); // lazy check
    await triggerRouteHandler(route, "GET");
    expect(mockCreateEmulateHandler).toHaveBeenCalledTimes(1);
  });

  it("calls createEmulateHandler with a services object", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    expect(mockCreateEmulateHandler).toHaveBeenCalledWith(
      expect.objectContaining({ services: expect.any(Object) })
    );
  });
});

describe("emulate route — NEXT_PUBLIC_EMULATE_GITHUB disabled (default)", () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateEmulateHandler.mockClear();
    delete process.env.NEXT_PUBLIC_EMULATE_GITHUB;
    // The emulator is now off by default; opt in so these tests exercise the
    // enabled (createEmulateHandler) path.
    process.env.EMULATE_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.EMULATE_ENABLED;
  });

  it("does NOT register github service when env var is not set", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    const callArg = mockCreateEmulateHandler.mock.calls[0][0] as { services: Record<string, unknown> };
    expect(callArg.services).not.toHaveProperty("github");
  });

  it("registers no services by default", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    const callArg = mockCreateEmulateHandler.mock.calls[0][0] as { services: Record<string, unknown> };
    expect(Object.keys(callArg.services)).toHaveLength(0);
  });
});

describe("emulate route — NEXT_PUBLIC_EMULATE_GITHUB enabled", () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateEmulateHandler.mockClear();
    process.env.NEXT_PUBLIC_EMULATE_GITHUB = "true";
    // The emulator is now off by default; opt in so these tests exercise the
    // enabled (createEmulateHandler) path.
    process.env.EMULATE_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_EMULATE_GITHUB;
    delete process.env.EMULATE_ENABLED;
  });

  it("registers github service when NEXT_PUBLIC_EMULATE_GITHUB=true", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    const callArg = mockCreateEmulateHandler.mock.calls[0][0] as { services: Record<string, unknown> };
    expect(callArg.services).toHaveProperty("github");
  });

  it("github service has an emulator property", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    const callArg = mockCreateEmulateHandler.mock.calls[0][0] as {
      services: Record<string, { emulator: unknown; seed?: Record<string, unknown> }>;
    };
    expect(callArg.services.github.emulator).toBeDefined();
  });

  it("github service seed includes axiomid-dev user", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    const callArg = mockCreateEmulateHandler.mock.calls[0][0] as {
      services: Record<string, { emulator: unknown; seed?: Record<string, unknown> }>;
    };
    const seed = callArg.services.github.seed as { users: { login: string }[] };
    expect(seed.users).toEqual(
      expect.arrayContaining([expect.objectContaining({ login: "axiomid-dev" })])
    );
  });

  it("github service seed includes hello-world repo", async () => {
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    const callArg = mockCreateEmulateHandler.mock.calls[0][0] as {
      services: Record<string, { emulator: unknown; seed?: Record<string, unknown> }>;
    };
    const seed = callArg.services.github.seed as { repos: { name: string }[] };
    expect(seed.repos).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "hello-world" })])
    );
  });

  it("does NOT register github service when env var is 'false'", async () => {
    process.env.NEXT_PUBLIC_EMULATE_GITHUB = "false";
    const route = await import("@/app/api/emulate/[...path]/route");
    await triggerRouteHandler(route, "GET");
    const callArg = mockCreateEmulateHandler.mock.calls[0][0] as { services: Record<string, unknown> };
    expect(callArg.services).not.toHaveProperty("github");
  });
});