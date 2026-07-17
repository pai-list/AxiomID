/**
 * Tests for src/components/landing/InteractiveShowcase.tsx (PR rewrite)
 *
 * The component was completely rewritten from an auto-cycling "identity
 * lifecycle" demo into a manually-controlled, three-tab showcase
 * ("Protocol Roadmap", "Identity Core", "Identity Capsule"). These tests
 * cover the new tab-switching behavior and per-tab content rendering.
 *
 * Note: framer-motion is globally mocked in jest.setup.js to render its
 * children directly (no animation), so tab content transitions can be
 * asserted synchronously.
 */

jest.mock("@/app/context/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) => require("@/i18n/en.json")[key] || key,
    language: "en",
  }),
}));

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InteractiveShowcase from "@/components/landing/InteractiveShowcase";

describe("InteractiveShowcase — default state", () => {
  it("renders all three tab buttons", () => {
    render(<InteractiveShowcase />);
    expect(screen.getByText("Protocol Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Identity Core")).toBeInTheDocument();
    expect(screen.getByText("Identity Capsule")).toBeInTheDocument();
  });

  it("shows the roadmap tab content by default", () => {
    render(<InteractiveShowcase />);
    expect(screen.getByText("Evolution of the Protocol")).toBeInTheDocument();
  });

  it("does not show architecture or capsule content by default", () => {
    render(<InteractiveShowcase />);
    expect(screen.queryByText("Event-Driven Job Orchestration")).not.toBeInTheDocument();
    expect(screen.queryByText("The Identity Capsule")).not.toBeInTheDocument();
  });

  it("marks the roadmap tab button as active by default", () => {
    render(<InteractiveShowcase />);
    const roadmapButton = screen.getByText("Protocol Roadmap").closest("button");
    expect(roadmapButton?.className).toContain("bg-electric-blue");
  });

  it("does not mark inactive tab buttons as active", () => {
    render(<InteractiveShowcase />);
    const archButton = screen.getByText("Identity Core").closest("button");
    expect(archButton?.className).not.toContain("bg-electric-blue");
  });

  it("renders the roadmap milestones (Q3, Q4, Q1)", () => {
    render(<InteractiveShowcase />);
    expect(screen.getByText("Q3")).toBeInTheDocument();
    expect(screen.getByText("Q4")).toBeInTheDocument();
    expect(screen.getByText("Q1")).toBeInTheDocument();
  });
});

describe("InteractiveShowcase — switching to the 'Identity Core' tab", () => {
  it("shows the architecture content after clicking 'Identity Core'", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Core"));
    expect(screen.getByText("Event-Driven Job Orchestration")).toBeInTheDocument();
  });

  it("hides the roadmap content after switching tabs", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Core"));
    expect(screen.queryByText("Evolution of the Protocol")).not.toBeInTheDocument();
  });

  it("marks the 'Identity Core' button as active after clicking it", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Core"));
    const archButton = screen.getByText("Identity Core").closest("button");
    expect(archButton?.className).toContain("bg-electric-blue");
  });

  it("un-marks the roadmap button as active after switching away", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Core"));
    const roadmapButton = screen.getByText("Protocol Roadmap").closest("button");
    expect(roadmapButton?.className).not.toContain("bg-electric-blue");
  });
});

describe("InteractiveShowcase — switching to the 'Identity Capsule' tab", () => {
  it("shows the capsule content after clicking 'Identity Capsule'", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Capsule"));
    expect(screen.getByText("The Identity Capsule")).toBeInTheDocument();
  });

  it("renders the capsule's feature list", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Capsule"));
    expect(screen.getByText("Verifiable DID Credentials")).toBeInTheDocument();
    expect(screen.getByText("Trust Score History")).toBeInTheDocument();
    expect(screen.getByText("Installed Capability Packs")).toBeInTheDocument();
    expect(screen.getByText("Embedded Base Genome")).toBeInTheDocument();
  });

  it("hides roadmap and architecture content while capsule tab is active", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Capsule"));
    expect(screen.queryByText("Evolution of the Protocol")).not.toBeInTheDocument();
    expect(screen.queryByText("Event-Driven Job Orchestration")).not.toBeInTheDocument();
  });
});

describe("InteractiveShowcase — repeated interaction", () => {
  it("returns to the roadmap tab when clicked again after navigating away", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Identity Capsule"));
    expect(screen.getByText("The Identity Capsule")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Protocol Roadmap"));
    expect(screen.getByText("Evolution of the Protocol")).toBeInTheDocument();
    expect(screen.queryByText("The Identity Capsule")).not.toBeInTheDocument();
  });

  it("remains on the same tab and renders only one content section when clicking the active tab again", () => {
    render(<InteractiveShowcase />);
    fireEvent.click(screen.getByText("Protocol Roadmap"));
    expect(screen.getByText("Evolution of the Protocol")).toBeInTheDocument();
    expect(screen.queryByText("Event-Driven Job Orchestration")).not.toBeInTheDocument();
    expect(screen.queryByText("The Identity Capsule")).not.toBeInTheDocument();
  });
});