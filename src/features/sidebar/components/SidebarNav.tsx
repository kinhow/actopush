"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stack, Text, Group, ScrollArea } from "@mantine/core";
import { NAV_SECTIONS } from "../constants/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <ScrollArea component="nav" flex={1} px="md">
      {NAV_SECTIONS.map((section) => (
        <Stack key={section.label} gap={0}>
          <Text size="sm" p="md" c="var(--octopush-color-foreground)">
            {section.label}
          </Text>
          <Stack gap={0}>
            {section.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full no-underline transition-colors ${
                    isActive
                      ? "bg-octopush-elevated text-octopush-primary"
                      : "text-octopush-foreground hover:bg-octopush-elevated/50"
                  }`}
                >
                  <Group gap="md" px="md" py="sm" wrap="nowrap">
                    <item.icon size={24} stroke={1.5} />
                    <Text size="md" inherit>
                      {item.label}
                    </Text>
                  </Group>
                </Link>
              );
            })}
          </Stack>
        </Stack>
      ))}
    </ScrollArea>
  );
}
