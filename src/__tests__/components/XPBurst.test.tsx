import { render, screen, act } from "@testing-library/react";
import { XPBurst } from "@/components/XPBurst";
import '@testing-library/jest-dom';

jest.useFakeTimers();

describe("XPBurst", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("renders null initially when trigger is false", () => {
    const { container } = render(<XPBurst xp={50} trigger={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders xp and particles when trigger is true", async () => {
    const { container } = render(<XPBurst xp={100} trigger={true} />);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText("+100 XP")).toBeInTheDocument();

    // Check if particles are rendered (there should be 8 particles)
    const particles = container.querySelectorAll('.animate-xp-particle');
    expect(particles.length).toBe(8);
  });

  it("disappears after 1200ms", async () => {
    const { container } = render(<XPBurst xp={100} trigger={true} />);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText("+100 XP")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1199);
    });

    expect(screen.queryByText("+100 XP")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("cleans up timer on unmount", async () => {
    const { unmount } = render(<XPBurst xp={100} trigger={true} />);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("reacts to trigger changes properly", async () => {
    const { rerender } = render(<XPBurst xp={100} trigger={false} />);

    expect(screen.queryByText("+100 XP")).not.toBeInTheDocument();

    // Turn trigger on
    rerender(<XPBurst xp={100} trigger={true} />);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText("+100 XP")).toBeInTheDocument();

    // Change XP value while triggered
    rerender(<XPBurst xp={200} trigger={true} />);

    expect(screen.getByText("+200 XP")).toBeInTheDocument();
  });
});
