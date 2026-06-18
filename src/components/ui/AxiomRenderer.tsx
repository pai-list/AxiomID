import { Renderer } from "@json-render/react";
import { registry } from "@/lib/registry";
import React from "react";

interface AxiomRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: any;
}

export function AxiomRenderer({ spec }: AxiomRendererProps) {
  return <Renderer spec={spec} registry={registry} />;
}
