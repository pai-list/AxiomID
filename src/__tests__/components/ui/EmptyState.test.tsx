import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/app/context/language-context";

jest.mock("@/app/context/language-context", () => ({
  useLanguage: jest.fn(),
}));

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

describe("EmptyState component", () => {
  const defaultProps = {
    title: "English Title",
    desc: "English Description",
  };

  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ language: "en", setLanguage: jest.fn(), t: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the title and description in English", () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText("English Title")).toBeInTheDocument();
    expect(screen.getByText("English Description")).toBeInTheDocument();
  });

  it("renders Arabic strings when language is set to 'ar'", () => {
    mockUseLanguage.mockReturnValue({ language: "ar", setLanguage: jest.fn(), t: jest.fn() });
    render(
      <EmptyState
        title="English Title"
        titleAr="العنوان بالعربية"
        desc="English Description"
        descAr="الوصف بالعربية"
      />
    );
    expect(screen.getByText("العنوان بالعربية")).toBeInTheDocument();
    expect(screen.getByText("الوصف بالعربية")).toBeInTheDocument();
  });

  it("falls back to English strings if Arabic is not provided when language is 'ar'", () => {
    mockUseLanguage.mockReturnValue({ language: "ar", setLanguage: jest.fn(), t: jest.fn() });
    render(<EmptyState title="English Title Only" desc="English Description Only" />);
    expect(screen.getByText("English Title Only")).toBeInTheDocument();
    expect(screen.getByText("English Description Only")).toBeInTheDocument();
  });

  it("renders an icon when provided", () => {
    render(<EmptyState {...defaultProps} icon={<span data-testid="custom-icon">Icon</span>} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders an action button and responds to clicks", () => {
    const onClickMock = jest.fn();
    render(
      <EmptyState
        {...defaultProps}
        action={{ label: "Click Me", onClick: onClickMock }}
      />
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("renders action button label in Arabic when language is 'ar'", () => {
    mockUseLanguage.mockReturnValue({ language: "ar", setLanguage: jest.fn(), t: jest.fn() });
    render(
      <EmptyState
        {...defaultProps}
        action={{ label: "Click Me", labelAr: "انقرني", onClick: jest.fn() }}
      />
    );

    expect(screen.getByRole("button", { name: "انقرني" })).toBeInTheDocument();
  });
});
