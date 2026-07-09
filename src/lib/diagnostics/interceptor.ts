let enabled = false;

export function enableDiagnostics() {
  if (enabled) return;
  enabled = true;

  if (typeof window === "undefined") return;

  // Capture unhandled errors
  window.addEventListener("error", (event) => {
    sendDiagnostic("error", "client", event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    sendDiagnostic("error", "client", `Unhandled Promise: ${reason}`, {
      type: typeof reason,
      message: reason?.message || String(reason),
      stack: reason?.stack,
    });
  });

  // Intercept Pi SDK errors
  interceptPiSdk();

  // Intercept fetch errors
  interceptFetch();

  console.log("[DIAG] Diagnostics enabled — errors will be captured");
}

function sendDiagnostic(
  level: "error" | "warn" | "info",
  source: string,
  message: string,
  details?: Record<string, unknown>,
) {
  try {
    navigator.sendBeacon(
      "/api/diagnostics/capture",
      new Blob(
        [JSON.stringify({ level, source, message, details, url: window.location.href })],
        { type: "application/json" },
      ),
    );
  } catch {
    // Silent fail — don't break the app
  }
}

function interceptPiSdk() {
  // Wait for Pi SDK to load
  const checkPi = setInterval(() => {
    if (typeof window === "undefined" || !window.Pi) return;
    clearInterval(checkPi);

    // Wrap Pi.authenticate
    const origAuth = window.Pi.authenticate.bind(window.Pi);
    window.Pi.authenticate = (...args: Parameters<typeof origAuth>) => {
      sendDiagnostic("info", "pi-sdk", "Pi.authenticate called", {
        scopes: args[0],
      });
      return origAuth(...args).catch((err: unknown) => {
        sendDiagnostic("error", "pi-sdk", `Pi.authenticate failed: ${err}`, {
          error: String(err),
          name: (err as Error)?.name,
          message: (err as Error)?.message,
        });
        throw err;
      });
    };

    // Wrap Pi.createPayment
    const origPay = window.Pi.createPayment.bind(window.Pi);
    window.Pi.createPayment = (...args: Parameters<typeof origPay>) => {
      sendDiagnostic("info", "pi-sdk", "Pi.createPayment called", {
        amount: args[0]?.amount,
        memo: args[0]?.memo,
      });
      return origPay(...args);
    };

    // Wrap Pi.init
    const origInit = window.Pi.init.bind(window.Pi);
    window.Pi.init = (...args: Parameters<typeof origInit>) => {
      sendDiagnostic("info", "pi-sdk", "Pi.init called", {
        config: args[0],
      });
      try {
        const result = origInit(...args);
        sendDiagnostic("info", "pi-sdk", "Pi.init succeeded");
        return result;
      } catch (err: unknown) {
        sendDiagnostic("error", "pi-sdk", `Pi.init failed: ${err}`, {
          error: String(err),
        });
        throw err;
      }
    };

    sendDiagnostic("info", "pi-sdk", "Pi SDK intercepted", {
      sdkVersion: "2.0",
      hostname: window.location.hostname,
    });
  }, 200);

  // Stop checking after 10s
  setTimeout(() => clearInterval(checkPi), 10000);
}

function interceptFetch() {
  const origFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof origFetch>) => {
    const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].toString() : args[0]?.url || "unknown";
    const method = args[1]?.method || "GET";

    try {
      const response = await origFetch(...args);

      // Log failed API calls
      if (url.includes("/api/") && !response.ok) {
        const body = await response.clone().text().catch(() => "unreadable");
        sendDiagnostic("error", "api", `API ${method} ${url} → ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          body: body.slice(0, 500),
          method,
        });
      }

      return response;
    } catch (err: unknown) {
      sendDiagnostic("error", "network", `Fetch failed: ${method} ${url}`, {
        error: (err as Error)?.message || String(err),
        type: (err as Error)?.name,
      });
      throw err;
    }
  };
}
