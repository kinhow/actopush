import type { ComponentType } from "react";

/**
 * A single navigation item in the sidebar
 */
export type NavItem = {
  icon: ComponentType<{ size?: number; stroke?: number }>;
  label: string;
  href: string;
  active?: boolean;
};

/**
 * A group of navigation items under a section label
 */
export type NavSection = {
  label: string;
  items: NavItem[];
};
