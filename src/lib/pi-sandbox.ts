export function patchPostMessageForSandbox(): void {
  const originalPostMessage = window.postMessage.bind(window);

  window.postMessage = ((message: any, targetOrigin: string, ...args: any[]) => {
    if (window.parent && window.parent !== window) {
      (window.parent as any).postMessage(message, "*", ...args);
    } else {
      originalPostMessage(message, targetOrigin, ...args);
    }
  }) as typeof window.postMessage;
}

export function listenForPiSDKMessages(): void {
  function handlePiMessage(event: MessageEvent) {
    if (typeof event.data !== "string") return;

    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "@pi:app:sdk:communication_information_request") {
        const response = {
          type: "@pi:app:sdk:communication_information_response",
          id: msg.id,
          payload: {
            frontend_url: process.env.NEXT_PUBLIC_SITE_URL || "https://axiomid.app",
            development_url:
              process.env.NEXT_PUBLIC_DEV_URL || "https://axiomid8992.pinet.com",
            slug: msg.payload?.slug || "",
            name: msg.payload?.name || "AxiomID",
          },
        };
        event.source?.postMessage(JSON.stringify(response), {
          targetOrigin: event.origin,
        });
      }
    } catch {
      // Ignore non-JSON messages
    }
  }

  window.addEventListener("message", handlePiMessage);
}

export function initSandboxCompatibility(): void {
  if (typeof window === "undefined") return;

  patchPostMessageForSandbox();
  listenForPiSDKMessages();
}
