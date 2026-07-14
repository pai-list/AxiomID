import { test, expect } from "@playwright/test";

test.describe("DID Document Endpoint", () => {
  test("GET /.well-known/did.json returns valid DID document", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body["@context"]).toContain("https://www.w3.org/ns/did/v1");
    expect(body.id).toBeTruthy();
    expect(body.id).toMatch(/^did:/);
  });

  test("Content-Type is application/did+ld+json or application/json", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    const contentType = response.headers()["content-type"] || "";
    const isDidLdJson = contentType.includes("application/did+ld+json");
    const isJson = contentType.includes("application/json");
    expect(isDidLdJson || isJson).toBeTruthy();
  });

  test("DID document contains id, verificationMethod, authentication", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    const body = await response.json();

    expect(body.id).toBeTruthy();
    expect(body.verificationMethod).toBeDefined();
    expect(Array.isArray(body.verificationMethod)).toBeTruthy();
    expect(body.verificationMethod.length).toBeGreaterThan(0);
    expect(body.authentication).toBeDefined();
    expect(Array.isArray(body.authentication)).toBeTruthy();
    expect(body.authentication.length).toBeGreaterThan(0);
  });

  test("verificationMethod has Ed25519VerificationKey2020 type", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    const body = await response.json();

    const method = body.verificationMethod[0];
    expect(method.type).toBe("Ed25519VerificationKey2020");
    expect(method.controller).toBe(body.id);
    expect(method.publicKeyMultibase).toBeTruthy();
  });

  test("DID document includes service endpoints", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    const body = await response.json();

    expect(body.service).toBeDefined();
    expect(Array.isArray(body.service)).toBeTruthy();
    expect(body.service.length).toBeGreaterThanOrEqual(3);

    const serviceTypes = body.service.map((s: { type: string }) => s.type);
    expect(serviceTypes).toContain("AxiomPassport");
    expect(serviceTypes).toContain("AgentCoordination");
    expect(serviceTypes).toContain("CredentialStatus");
  });

  test("DID document includes alsoKnownAs", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    const body = await response.json();

    expect(body.alsoKnownAs).toBeDefined();
    expect(body.alsoKnownAs).toContain("https://axiomid.app");
  });

  test("cache headers present on DID document", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    const cacheControl = response.headers()["cache-control"] || "";
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("max-age");
  });

  test("error when ISSUER_PUBLIC_KEY not configured", async ({ request }) => {
    // This tests the actual error path; in dev env the key is usually set,
    // but if not, we verify the response is a proper error, not a crash.
    const response = await request.get("/.well-known/did.json");
    // If key is set, we get 200; if not, we get 500 with a safe error.
    if (!response.ok()) {
      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body.error).toBeTruthy();
      expect(body.code).toBe("INTERNAL_ERROR");
    } else {
      expect(response.status()).toBe(200);
    }
  });

  test("no sensitive info leaked in error responses", async ({ request }) => {
    const response = await request.get("/.well-known/did.json");
    if (!response.ok()) {
      const text = await response.text();
      expect(text).not.toContain("ISSUER_PUBLIC_KEY");
      expect(text).not.toContain("PRIVATE_KEY");
      expect(text).not.toContain("DATABASE_URL");
      expect(text).not.toContain("pi_access_token");
    }
  });
});

test.describe("JWKS Endpoint", () => {
  test("GET /.well-known/jwks.json returns valid JWKS", async ({ request }) => {
    const response = await request.get("/.well-known/jwks.json");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.keys).toBeDefined();
    expect(Array.isArray(body.keys)).toBeTruthy();
  });

  test("JWKS keys have required fields", async ({ request }) => {
    const response = await request.get("/.well-known/jwks.json");
    const body = await response.json();

    if (body.keys.length > 0) {
      const key = body.keys[0];
      expect(key.kty).toBeTruthy();
      expect(key.kid).toBeTruthy();
      expect(key.use).toBeTruthy();
      expect(key.alg).toBeTruthy();
    }
  });

  test("cache headers present on JWKS", async ({ request }) => {
    const response = await request.get("/.well-known/jwks.json");
    const cacheControl = response.headers()["cache-control"] || "";
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage");
  });
});

test.describe("OAuth Authorization Server Metadata", () => {
  test("GET /.well-known/oauth-authorization-server returns valid config", async ({ request }) => {
    const response = await request.get("/.well-known/oauth-authorization-server");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.issuer).toBe("https://axiomid.app");
    expect(body.authorization_endpoint).toBeTruthy();
    expect(body.token_endpoint).toBeTruthy();
    expect(body.jwks_uri).toBeTruthy();
  });

  test("OAuth metadata includes supported grant types", async ({ request }) => {
    const response = await request.get("/.well-known/oauth-authorization-server");
    const body = await response.json();

    expect(body.grant_types_supported).toBeDefined();
    expect(body.grant_types_supported).toContain("urn:ietf:params:oauth:grant-type:jwt-bearer");
    expect(body.grant_types_supported).toContain("claim");
  });

  test("OAuth metadata includes supported scopes", async ({ request }) => {
    const response = await request.get("/.well-known/oauth-authorization-server");
    const body = await response.json();

    expect(body.scopes_supported).toBeDefined();
    expect(body.scopes_supported).toContain("api.read");
    expect(body.scopes_supported).toContain("api.write");
    expect(body.scopes_supported).toContain("agent.sign");
  });

  test("OAuth metadata includes agent_auth config", async ({ request }) => {
    const response = await request.get("/.well-known/oauth-authorization-server");
    const body = await response.json();

    expect(body.agent_auth).toBeDefined();
    expect(body.agent_auth.type).toBe("oidc");
    expect(body.agent_auth.claims_supported).toContain("sub");
    expect(body.agent_auth.claims_supported).toContain("iss");
    expect(body.agent_auth.claims_supported).toContain("aud");
  });

  test("cache headers present on OAuth metadata", async ({ request }) => {
    const response = await request.get("/.well-known/oauth-authorization-server");
    const cacheControl = response.headers()["cache-control"] || "";
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage");
  });
});
