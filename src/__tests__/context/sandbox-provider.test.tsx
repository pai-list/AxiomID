import { render } from "@testing-library/react";
import { SandboxProvider } from "@/app/context/sandbox-provider";
import { initSandboxCompatibility } from "@/lib/pi-sandbox";

// Mock the pi-sandbox module
jest.mock("@/lib/pi-sandbox", () => ({
  initSandboxCompatibility: jest.fn(),
}));

describe("SandboxProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children correctly", () => {
    const { getByText } = render(
      <SandboxProvider>
        <div>Test Child Component</div>
      </SandboxProvider>
    );

    expect(getByText("Test Child Component")).toBeInTheDocument();
  });

  it("should call initSandboxCompatibility on mount", () => {
    render(
      <SandboxProvider>
        <div>Test Child Component</div>
      </SandboxProvider>
    );

    expect(initSandboxCompatibility).toHaveBeenCalledTimes(1);
  });

  it("should render multiple children without altering their structure", () => {
    const { getByText } = render(
      <SandboxProvider>
        <div>First Child</div>
        <span>Second Child</span>
      </SandboxProvider>
    );

    expect(getByText("First Child")).toBeInTheDocument();
    expect(getByText("Second Child")).toBeInTheDocument();
  });

  it("should not call initSandboxCompatibility again when re-rendered with new children", () => {
    const { rerender } = render(
      <SandboxProvider>
        <div>Initial Child</div>
      </SandboxProvider>
    );

    expect(initSandboxCompatibility).toHaveBeenCalledTimes(1);

    rerender(
      <SandboxProvider>
        <div>Updated Child</div>
      </SandboxProvider>
    );

    // useEffect has an empty dependency array, so it should only run once
    expect(initSandboxCompatibility).toHaveBeenCalledTimes(1);
  });

  it("should not call initSandboxCompatibility again after unmounting a previous instance", () => {
    const { unmount } = render(
      <SandboxProvider>
        <div>Test Child Component</div>
      </SandboxProvider>
    );

    expect(initSandboxCompatibility).toHaveBeenCalledTimes(1);

    unmount();

    // Unmounting should not trigger any additional calls to initSandboxCompatibility
    expect(initSandboxCompatibility).toHaveBeenCalledTimes(1);
  });

  it("should call the cleanup function returned by initSandboxCompatibility on unmount", () => {
    const mockCleanup = jest.fn();
    (initSandboxCompatibility as jest.Mock).mockReturnValue(mockCleanup);

    const { unmount } = render(
      <SandboxProvider>
        <div>Test Child Component</div>
      </SandboxProvider>
    );

    unmount();

    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });

  it("should propagate an error if initSandboxCompatibility throws", () => {
    (initSandboxCompatibility as jest.Mock).mockImplementationOnce(() => {
      throw new Error("sandbox init failed");
    });

    expect(() =>
      render(
        <SandboxProvider>
          <div>Test Child Component</div>
        </SandboxProvider>
      )
    ).toThrow("sandbox init failed");

    expect(initSandboxCompatibility).toHaveBeenCalledTimes(1);
  });
});
