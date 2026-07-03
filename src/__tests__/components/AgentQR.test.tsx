import React from "react";
import { render, screen } from "@testing-library/react";
import { AgentQR } from "@/components/AgentQR";

// Mock QRCodeSVG to isolate testing and avoid actual canvas rendering issues
jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value, size, "aria-label": ariaLabel, bgColor, fgColor, level, includeMargin }: any) => (
    <svg
      data-testid="qrcode-svg"
      data-value={value}
      data-size={size}
      aria-label={ariaLabel}
      data-bgcolor={bgColor}
      data-fgcolor={fgColor}
      data-level={level}
      data-includemargin={includeMargin}
    />
  ),
}));

describe("AgentQR", () => {
  const mockDid = "did:axiom:test12345";

  it("renders without crashing", () => {
    render(<AgentQR did={mockDid} />);
    expect(screen.getByText(mockDid)).toBeInTheDocument();
  });

  it("displays the correct DID text", () => {
    render(<AgentQR did={mockDid} />);
    const didText = screen.getByText(mockDid);
    expect(didText).toBeInTheDocument();

    // Check all Tailwind classes applied to the text
    expect(didText).toHaveClass(
      "text-[8px]",
      "font-mono",
      "text-faint",
      "text-center",
      "max-w-[180px]",
      "break-all"
    );
  });

  it("renders the QRCodeSVG with default properties", () => {
    render(<AgentQR did={mockDid} />);
    const qrCode = screen.getByTestId("qrcode-svg");

    expect(qrCode).toBeInTheDocument();
    expect(qrCode).toHaveAttribute("data-value", mockDid);
    expect(qrCode).toHaveAttribute("data-size", "160"); // Default size
    expect(qrCode).toHaveAttribute("data-bgcolor", "#ffffff");
    expect(qrCode).toHaveAttribute("data-fgcolor", "#0a0a0a");
    expect(qrCode).toHaveAttribute("data-level", "M");
    expect(qrCode).toHaveAttribute("data-includemargin", "false");
  });

  it("renders the QRCodeSVG with a custom size", () => {
    render(<AgentQR did={mockDid} size={200} />);
    const qrCode = screen.getByTestId("qrcode-svg");

    expect(qrCode).toBeInTheDocument();
    expect(qrCode).toHaveAttribute("data-value", mockDid);
    expect(qrCode).toHaveAttribute("data-size", "200");
  });

  it("sets the correct aria-label on QRCodeSVG for accessibility", () => {
    render(<AgentQR did={mockDid} />);
    const qrCode = screen.getByTestId("qrcode-svg");
    expect(qrCode).toHaveAttribute("aria-label", `QR code for DID: ${mockDid}`);
  });

  it("wraps the content in correct layout containers", () => {
    const { container } = render(<AgentQR did={mockDid} />);

    // Test the outer container
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("flex", "flex-col", "items-center", "gap-2");

    // Test the inner QR wrapper
    const qrWrapper = outerDiv.firstChild as HTMLElement;
    expect(qrWrapper).toHaveClass("bg-white", "p-3", "rounded-xl");
  });
});
