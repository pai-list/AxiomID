# 🟣 Pi SDK & Integration Guidelines

This document serves as the canonical source for rules regarding Pi Network integration.

## 1. Browser-Only Execution
- **Rule:** The Pi SDK (`window.Pi`) must **never** be imported or executed in server-side code.
- **Enforcement:** Always protect Pi SDK calls behind a `typeof window !== 'undefined'` check.

## 2. Dynamic Sandbox Detection
- **Rule:** Never hardcode `sandbox: true` or `false` in the Pi SDK initialization.
- **Enforcement:** Use the unified `determineSandboxMode()` helper.

## 3. Mocking in Tests
- **Rule:** When creating mock auth requests in tests, provide a Pi Browser `User-Agent` header to prevent immediate rejection.

## 4. End-to-End Testing (Sandbox)
- **Reference:** See the testing guidelines in [testing.md](./testing.md).
