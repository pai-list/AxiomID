"use client";

import { type HTMLAttributes } from "react";

interface SkeletonBaseProps extends HTMLAttributes<HTMLDivElement> {
  "data-testid"?: string;
}

interface SkeletonLineProps extends SkeletonBaseProps {
  width?: string;
  height?: string;
}

export function SkeletonLine({
  width = "100%",
  height = "1rem",
  className = "",
  style,
  ...props
}: SkeletonLineProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded ${className}`}
      style={{ ...style, width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonCardProps extends SkeletonBaseProps {
  width?: string;
  height?: string;
}

export function SkeletonCard({
  width = "100%",
  height = "200px",
  className = "",
  style,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded-xl ${className}`}
      style={{ ...style, width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonCircleProps extends SkeletonBaseProps {
  size?: string;
}

export function SkeletonCircle({
  size = "3rem",
  className = "",
  style,
  ...props
}: SkeletonCircleProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded-full ${className}`}
      style={{ ...style, width: size, height: size }}
      aria-hidden="true"
    />
  );
}

interface SkeletonImageProps extends SkeletonBaseProps {
  aspectRatio?: string;
}

export function SkeletonImage({
  aspectRatio = "4/3",
  className = "",
  style,
  ...props
}: SkeletonImageProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded-lg ${className}`}
      style={{ ...style, aspectRatio }}
      aria-hidden="true"
    />
  );
}
