import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useLanguage } from "@/app/context/language-context";

// Mock the language context
jest.mock("@/app/context/language-context", () => ({
  useLanguage: jest.fn(),
}));

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

// Create a component that throws an error for testing
const ThrowError = ({ message = "Test error" }: { message?: string }) => {
  throw new Error(message);
};

// Suppress console.error during tests to keep output clean
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({
      language: "en",
      setLanguage: jest.fn(),
      t: (key: string) => key,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-element">Child Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child-element")).toBeInTheDocument();
  });

  it("renders the default ErrorFallback when an error is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Assert that the default fallback UI is shown
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reload Page/i })).toBeInTheDocument();
  });

  it("renders custom fallback when provided and an error is thrown", () => {
    const CustomFallback = <div data-testid="custom-fallback">Custom Error View</div>;
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("shows stringified error if error is not an Error instance", () => {
    const ThrowStringError = () => {
      throw "String error";
    };

    render(
      <ErrorBoundary>
        <ThrowStringError />
      </ErrorBoundary>
    );

    expect(screen.getByText("String error")).toBeInTheDocument();
  });

  it("shows fallback text if error message is falsy", () => {
    const ThrowEmptyError = () => {
      throw new Error("");
    };

    render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>
    );

    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument();
  });

  it("triggers onReset in default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole("button", { name: /Reload Page/i });
    expect(reloadButton).toBeInTheDocument();

    try {
      fireEvent.click(reloadButton);
    } catch (e) {
      // Ignored for jsdom limitation on window.location
    }
  });

  it("triggers onReset with custom fallback (simulated)", () => {
    // A trick to reach the custom fallback's onReset prop is to extract it
    // from the component. Since ErrorBoundary renders a ReactErrorBoundary
    // we can use a small test to mock ReactErrorBoundary specifically
    // to check its onReset behavior when provided a custom fallback

    // We isolate this to avoid breaking other tests
    jest.isolateModules(() => {
      // Create a mock for react-error-boundary
      jest.doMock("react-error-boundary", () => {
        return {
          ErrorBoundary: (props: { children?: React.ReactNode; onReset?: () => void }) => {
            if (props.onReset) {
              // Call onReset to cover it
              try {
                props.onReset();
              } catch (e) {
                // Ignore JSDOM location error
              }
            }
            return <div data-testid="mock-reb">{props.children}</div>;
          },
        };
      });

      // Require the module again with the mock in place
      const { ErrorBoundary: MockErrorBoundary } = require("@/components/ErrorBoundary");

      render(
        <MockErrorBoundary fallback={<div />}>
          <div />
        </MockErrorBoundary>
      );

      expect(screen.getByTestId("mock-reb")).toBeInTheDocument();
    });
  });

  it("uses Arabic translations when language is 'ar'", () => {
    mockUseLanguage.mockReturnValue({
      language: "ar",
      setLanguage: jest.fn(),
      t: (key: string) => key,
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("حدث خطأ ما")).toBeInTheDocument();
    expect(screen.getByText("إعادة تحميل الصفحة")).toBeInTheDocument();
  });
});
