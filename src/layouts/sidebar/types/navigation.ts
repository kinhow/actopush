import type { ComponentType } from "react";

/**
 * A single navigation item in the sidebar
 */
export interface NavItem {
  icon: ComponentType<{ size?: number; stroke?: number; className?: string }>;
  label: string;
  href: string;
}

/**
 * A group of navigation items under a section label
 */
export interface NavSection {
  label: string;
  items: NavItem[];
}
