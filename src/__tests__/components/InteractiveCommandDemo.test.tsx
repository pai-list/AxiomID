/**
 * Tests for src/components/landing/InteractiveCommandDemo.tsx (new in this PR)
 *
 * This client component renders a fake terminal that "plays back" three
 * simulated CLI commands (connect wallet / verify identity / deploy agent)
 * with a typewriter effect, gated so only the next command in sequence can
 * be triggered.
 *
 * IMPORTANT — regression bug documented below:
 * The component calls a bare `t("Try It Live", "جربه مباشرة")` (and two more
 * call sites) for its heading copy, but unlike every other bilingual
 * component in this codebase it never imports/derives `t` (e.g. via
 * `useLanguage()` or a `t` prop). `t` is therefore an undeclared free
 * variable, so mounting the component throws `ReferenceError: t is not
 * defined`. The first describe block below locks in and documents that
 * current (broken) behavior so a fix is required before this component can
 * ever render in production.
 *
 * The remaining describe blocks polyfill a global `t` (mirroring the
 * `(en, ar) => language === "en" ? en : ar` helper used elsewhere in this
 * codebase) purely as a test workaround so the rest of the component's
 * command-loop/terminal logic — which is the real "main functionality" of
 * this component — can still be exercised and regression-tested. This is
 * NOT a substitute for fixing the missing import; see the first block.
 *
 * framer-motion (`motion`, `AnimatePresence`) is globally mocked in
 * jest.setup.js to render children directly without animation delays.
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import InteractiveCommandDemo from "@/components/landing/InteractiveCommandDemo";

describe("InteractiveCommandDemo — command loop", () => {
  let scrollIntoViewMock: jest.Mock;

  beforeAll(() => {
    scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  async function runStep() {
    // Generously covers the typewriter interval (15-40ms/char) plus the
    // 150ms inter-line pause for the longest command (5 lines).
    await act(async () => {
      await jest.advanceTimersByTimeAsync(15000);
    });
  }

  it("renders the heading, intro log line, and all three command buttons", () => {
    render(<InteractiveCommandDemo />);
    expect(screen.getByText("Agent Command Loop")).toBeInTheDocument();
    expect(
      screen.getByText("AxiomID Agent Protocol v1.0 — interactive demo")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify identity/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deploy agent/i })).toBeInTheDocument();
  });

  it("only enables the first command button on initial render", () => {
    render(<InteractiveCommandDemo />);
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /verify identity/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /deploy agent/i })).toBeDisabled();
  });

  it("shows an idle terminal prompt before any command has run", () => {
    const { container } = render(<InteractiveCommandDemo />);
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("running the first command streams its output into the terminal and unlocks the next step", async () => {
    render(<InteractiveCommandDemo />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await runStep();

    expect(screen.getByText("✓ Wallet connected: pi:8f3a...b2e1")).toBeInTheDocument();
    expect(screen.getByText("✓ Stellar address: GB7X...N4Y2")).toBeInTheDocument();
    expect(screen.getByText("Ready for verification step.")).toBeInTheDocument();

    // Completed step is now locked (already done) and disabled…
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeDisabled();
    // …while the next step becomes available.
    expect(screen.getByRole("button", { name: /verify identity/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /deploy agent/i })).toBeDisabled();
  });

  it("marks a completed command button with the done styling", async () => {
    render(<InteractiveCommandDemo />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await runStep();

    expect(screen.getByRole("button", { name: /connect wallet/i }).className).toContain(
      "bg-neon-green/10"
    );
  });

  it("does not start a command out of order (clicking a locked future step has no effect)", () => {
    render(<InteractiveCommandDemo />);

    fireEvent.click(screen.getByRole("button", { name: /deploy agent/i }));

    expect(screen.queryByText(/\$ deploy agent/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /verify identity/i })).toBeDisabled();
  });

  it("renders the input log line (prefixed with $) once a command has run", async () => {
    const { container } = render(<InteractiveCommandDemo />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await runStep();

    const inputLines = Array.from(container.querySelectorAll(".text-white")).filter(
      (el) => el.textContent === "connect wallet"
    );
    expect(inputLines.length).toBe(1);
  });

  it("runs all three commands in sequence and shows the completion summary with a working /claim link", async () => {
    render(<InteractiveCommandDemo />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await runStep();

    fireEvent.click(screen.getByRole("button", { name: /verify identity/i }));
    await runStep();

    fireEvent.click(screen.getByRole("button", { name: /deploy agent/i }));
    await runStep();

    expect(
      screen.getByText(/Agent identity claim complete — your sovereign passport is active\./i)
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /try it for real/i });
    expect(link).toHaveAttribute("href", "/claim");

    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /verify identity/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /deploy agent/i })).toBeDisabled();
  });

  it("renders the deploy agent output lines, including the passport link line", async () => {
    render(<InteractiveCommandDemo />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await runStep();
    fireEvent.click(screen.getByRole("button", { name: /verify identity/i }));
    await runStep();
    fireEvent.click(screen.getByRole("button", { name: /deploy agent/i }));
    await runStep();

    expect(screen.getByText("✓ Agent passport minted on-chain")).toBeInTheDocument();
    expect(screen.getByText("Agent Axiom Sentinel is now ACTIVE.")).toBeInTheDocument();
    expect(
      screen.getByText("→ View passport at axiomid.app/passport/a1b2...c3d4")
    ).toBeInTheDocument();
  });

  it("keeps the previously logged commands visible after running subsequent ones", async () => {
    render(<InteractiveCommandDemo />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await runStep();
    fireEvent.click(screen.getByRole("button", { name: /verify identity/i }));
    await runStep();

    // Output from the first command should still be present in the log.
    expect(screen.getByText("Ready for verification step.")).toBeInTheDocument();
    // As well as the newly logged output from the second command.
    expect(screen.getByText("✓ Pi KYC: VERIFIED (level 3)")).toBeInTheDocument();
  });

  it("scrolls the log into view as new output is streamed", async () => {
    render(<InteractiveCommandDemo />);
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await runStep();
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("renders the terminal window chrome (traffic-light dots and title)", () => {
    render(<InteractiveCommandDemo />);
    expect(screen.getByText("agent-command-loop — bash")).toBeInTheDocument();
  });
});