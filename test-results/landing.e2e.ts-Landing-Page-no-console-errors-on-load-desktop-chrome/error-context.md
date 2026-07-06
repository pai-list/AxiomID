# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.e2e.ts >> Landing Page >> no console errors on load
- Location: e2e/landing.e2e.ts:85:7

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

```
Error: write EPIPE
```

```
Error: browserContext.close: Target page, context or browser has been closed
```