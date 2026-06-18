/**
 * Emulate catch-all route — runs local API emulators on the same origin.
 * Solves Vercel preview deployment OAuth callback URL problems.
 *
 * Usage: npm install @emulators/adapter-next @emulators/github
 * Then set NEXT_PUBLIC_EMULATE_GITHUB=true to enable in dev.
 *
 * @see https://github.com/vercel-labs/emulate#nextjs-integration
 */
import { apiError } from "@/lib/errors";
import type { NextRequest } from "next/server";

type RouteHandler = (req: NextRequest, ctx: unknown) => Response | Promise<Response>;

// Never expose the emulator surface in production. The emulator route is a
// dev/preview-only tool; in production every method returns 404.
const notFound = () => apiError("NOT_FOUND", "Not found");

const isProdDeployment =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

// Defense in depth: the emulator is off by default and must be explicitly
// enabled via a server-side flag, so it is never an insecure default even on a
// misconfigured / internet-exposed non-production runtime (staging, self-hosted
// dev). It is additionally always disabled on production deployments.
const isEmulatorEnabled =
  !isProdDeployment && process.env.EMULATE_ENABLED === "true";

// Lazily build the emulator handler. The @emulators/* packages are dev/preview
// tooling and are imported dynamically only when the emulator is enabled, so
// they are never pulled into the production route bundle.
let handlerPromise: Promise<Record<string, RouteHandler>> | null = null;

async function buildEmulatorHandler(): Promise<Record<string, RouteHandler>> {
  const { createEmulateHandler } = await import("@emulators/adapter-next");
  const github = await import("@emulators/github");

  const services: Record<string, { emulator: typeof github; seed?: Record<string, unknown> }> = {};

  if (process.env.NEXT_PUBLIC_EMULATE_GITHUB === "true") {
    services.github = {
      emulator: github,
      seed: {
        users: [{ login: "axiomid-dev", name: "AxiomID Dev", email: "dev@axiomid.app" }],
        repos: [{ owner: "axiomid-dev", name: "hello-world", auto_init: true }],
      },
    };
  }

  return createEmulateHandler({ services });
}

function dispatch(method: string): RouteHandler {
  return async (req, ctx) => {
    if (!isEmulatorEnabled) return notFound();
    handlerPromise ??= buildEmulatorHandler();
    const handler = await handlerPromise;
    return handler[method](req, ctx);
  };
}

export const GET = dispatch("GET");
export const POST = dispatch("POST");
export const PUT = dispatch("PUT");
export const PATCH = dispatch("PATCH");
export const DELETE = dispatch("DELETE");
