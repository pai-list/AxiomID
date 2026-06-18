import { Renderer } from "@json-render/react";
import { registry } from "@/lib/registry";
import React from "react";

interface AxiomRendererProps {
  spec: unknown;
}

export function AxiomRenderer({ spec }: AxiomRendererProps) {
  // The public prop is `unknown` for caller flexibility; cast to the exact spec
  // type that Renderer expects at this boundary.
  return <Renderer spec={spec as React.ComponentProps<typeof Renderer>["spec"]} registry={registry} />;
}
