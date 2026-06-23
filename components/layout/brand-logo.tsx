import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Canonical brand name. Must always render exactly as "Mr.Cash"
 * (capital M, lowercase r, dot, capital C, lowercase ash).
 */
export const BRAND_NAME = "Mr.Cash";

interface BrandLogoProps {
  /** Pixel size of the logo mark. */
  size?: number;
  /** Hide the wordmark and only show the logo mark. */
  iconOnly?: boolean;
  /** Tailwind text size class for the wordmark. */
  wordmarkClassName?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Brand lockup used across the app. Renders the logo mark plus the
 * "Mr.Cash" wordmark with the brand gradient for absolute consistency.
 */
export function BrandLogo({
  size = 32,
  iconOnly = false,
  wordmarkClassName,
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <Image
        src="/logo.png"
        alt={`${BRAND_NAME} logo`}
        width={size}
        height={size}
        priority={priority}
        className="rounded-xl shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
      {!iconOnly && (
        <span
          className={cn(
            "font-black tracking-tight brand-gradient-text",
            wordmarkClassName ?? "text-lg",
          )}
        >
          {BRAND_NAME}
        </span>
      )}
    </span>
  );
}
