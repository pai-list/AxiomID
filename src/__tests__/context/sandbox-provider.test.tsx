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
});
