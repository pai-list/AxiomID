import React from "react";
import { render, screen, act } from "@testing-library/react";
import { AnimatedCounter } from "@/components/AnimatedCounter";

// We need to test the !isInView branch. Since jest.setup.js mocks useInView to true,
// we can locally mock framer-motion to control it if needed. Let's see if we can do this.
jest.mock("framer-motion", () => ({
  ...jest.requireActual("framer-motion"),
  useInView: jest.fn(),
}));

import { useInView } from "framer-motion";
const mockUseInView = useInView as jest.Mock;

describe("AnimatedCounter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseInView.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders correctly initially when not in view", () => {
    mockUseInView.mockReturnValue(false); // test the !isInView early return
    render(<AnimatedCounter target={100} />);
    const counterSpan = screen.getByRole("status");
    expect(counterSpan).toHaveTextContent("0");

    // Fast forward, it should still be 0 since it's not in view
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(counterSpan).toHaveTextContent("0");
  });

  it("animates to the target value", () => {
    render(<AnimatedCounter target={100} duration={1000} />);

    // Fast forward to middle of animation
    act(() => {
      jest.advanceTimersByTime(500);
    });

    const counterSpan = screen.getByRole("status");
    const currentValue = parseInt(counterSpan.textContent || "0");
    expect(currentValue).toBeGreaterThan(0);
    expect(currentValue).toBeLessThan(100);

    // Fast forward past the end to ensure we hit the final state
    act(() => {
      jest.advanceTimersByTime(600); // 500 + 600 > 1000
    });

    expect(counterSpan).toHaveTextContent("100");
  });

  it("applies prefix, suffix, and className correctly", () => {
    render(
      <AnimatedCounter
        target={100}
        prefix="$"
        suffix="%"
        className="test-class"
        duration={0} // instant
      />
    );

    const counterSpan = screen.getByRole("status");
    expect(counterSpan).toHaveClass("test-class");

    // Fast forward past the end
    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(counterSpan).toHaveTextContent("$100%");
  });

  it("formats large numbers with commas", () => {
    render(<AnimatedCounter target={1000000} duration={1000} />);

    // Fast forward past the end
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    const counterSpan = screen.getByRole("status");
    expect(counterSpan).toHaveTextContent("1,000,000");
  });

  it("cleans up the interval when unmounted", () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<AnimatedCounter target={100} duration={1000} />);

    // Unmount before animation completes
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
