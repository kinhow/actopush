"use client";

import { Group, Text } from "@mantine/core";
import Link from "next/link";
import type { ComponentType } from "react";

export interface NavLinkProps {
  href: string;
  icon: ComponentType<{ size?: number; stroke?: number; className?: string }>;
  label: string;
  active: boolean;
  className?: string;
}

export function NavLink({
  href,
  icon: Icon,
  label,
  active,
  className,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`no-underline transition-colors ${
        className ??
        `rounded-md ${active ? "bg-octopush-surface" : "hover:bg-octopush-surface"}`
      }`}
    >
      <Group gap={10} px={8} h={32} wrap="nowrap">
        <Icon
          size={16}
          stroke={1.5}
          className={active ? "text-octopush-foreground" : "text-[#9CA3AF]"}
        />
        <Text
          fz={13}
          fw={active ? 500 : 400}
          c={active ? "var(--octopush-color-foreground)" : "#9CA3AF"}
        >
          {label}
        </Text>
      </Group>
    </Link>
  );
}
