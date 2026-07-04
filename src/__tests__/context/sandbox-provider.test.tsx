import { render } from "@testing-library/react";
import { SandboxProvider } from "@/app/context/sandbox-provider";
import { initSandboxCompatibility } from "@/lib/pi-sandbox";

// Mock the pi-sandbox module
jest.mock("@/lib/pi-sandbox", () => ({
  initSandboxCompatibility: jest.fn(),
}));

function renderSandboxProvider() {
  return render(
    <SandboxProvider>
      <div>Test Child Component</div>
    </SandboxProvider>
  );
}

describe("SandboxProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children correctly", () => {
    const { getByText } = renderSandboxProvider();

    expect(getByText("Test Child Component")).toBeInTheDocument();
  });

  it("should call initSandboxCompatibility on mount", () => {
    renderSandboxProvider();

    expect(initSandboxCompatibility).toHaveBeenCalledTimes(1);
  });
});
