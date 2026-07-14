import React from "react";
import { render, screen, act } from "@testing-library/react";
import { PiBrowserGuard, PiBrowserBanner, usePiBrowser } from "@/components/PiBrowserGuard";
import * as piSdk from "@/lib/pi-sdk";
import * as languageContext from "@/app/context/language-context";

// Mock dependencies
jest.mock("@/lib/pi-sdk", () => ({
  checkPiBrowser: jest.fn(),
  determineSandboxMode: jest.fn(),
}));

jest.mock("@/app/context/language-context", () => ({
  useLanguage: jest.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("PiBrowserGuard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (languageContext.useLanguage as jest.Mock).mockReturnValue({
      language: "en",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render splash screen initially while detecting", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(true);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);

    render(
      <PiBrowserGuard>
        <div data-testid="children">Content</div>
      </PiBrowserGuard>
    );

    expect(screen.getByText("Detecting environment...")).toBeInTheDocument();
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("should render children if it is in the Pi Browser", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(true);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);

    render(
      <PiBrowserGuard>
        <div data-testid="children">Content</div>
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByText("Detecting environment...")).not.toBeInTheDocument();
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("should render fallback if outside Pi Browser and fallback is provided", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(false);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);

    render(
      <PiBrowserGuard fallback={<div data-testid="fallback">Fallback</div>}>
        <div data-testid="children">Content</div>
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("should render children if outside Pi Browser but no fallback provided", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(false);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);

    render(
      <PiBrowserGuard>
        <div data-testid="children">Content</div>
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("should render children if in Sandbox mode", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(false);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(true);

    render(
      <PiBrowserGuard fallback={<div data-testid="fallback">Fallback</div>}>
        <div data-testid="children">Content</div>
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });

  it("should respect the showSplash prop", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(true);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);

    render(
      <PiBrowserGuard showSplash={false}>
        <div data-testid="children">Content</div>
      </PiBrowserGuard>
    );

    expect(screen.queryByText("Detecting environment...")).not.toBeInTheDocument();
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("should translate the detecting message to Arabic if language is ar", () => {
    (languageContext.useLanguage as jest.Mock).mockReturnValue({
      language: "ar",
    });

    render(
      <PiBrowserGuard>
        <div data-testid="children">Content</div>
      </PiBrowserGuard>
    );

    expect(screen.getByText("جاري اكتشاف البيئة...")).toBeInTheDocument();
  });
});

describe("PiBrowserBanner", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (languageContext.useLanguage as jest.Mock).mockReturnValue({
      language: "en",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render the banner if in Pi Browser", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(true);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);

    render(
      <PiBrowserGuard>
        <PiBrowserBanner />
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
    expect(screen.getByText("Full functionality available")).toBeInTheDocument();
    expect(screen.getByText(/Pi Browser/i)).toBeInTheDocument();
  });

  it("should render Pi Sandbox text if in sandbox mode and Pi Browser", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(true);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(true);

    render(
      <PiBrowserGuard>
        <PiBrowserBanner />
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText(/Pi Sandbox/i)).toBeInTheDocument();
  });

  it("should not render the banner if not in Pi Browser", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(false);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <PiBrowserGuard>
        <PiBrowserBanner />
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("should translate banner text to Arabic if language is ar", () => {
    (piSdk.checkPiBrowser as jest.Mock).mockReturnValue(true);
    (piSdk.determineSandboxMode as jest.Mock).mockReturnValue(false);
    (languageContext.useLanguage as jest.Mock).mockReturnValue({
      language: "ar",
    });

    render(
      <PiBrowserGuard>
        <PiBrowserBanner />
      </PiBrowserGuard>
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText(/متصل/i)).toBeInTheDocument();
    expect(screen.getByText("جميع الوظائف متاحة")).toBeInTheDocument();
  });
});
