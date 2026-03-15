"use client";

import { Flex, Stack } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "../constants/navigation";
import { NavLink } from "./NavLink";

export function Sidebar() {
  const pathname = usePathname();

  const allItems = NAV_SECTIONS.flatMap((section) => section.items);

  return (
    <Stack
      w={221}
      h="100%"
      gap={0}
      component="aside"
      classNames={{
        root: "border-r border-octopush-divider bg-octopush-base",
      }}
    >
      <Flex direction="column" justify="space-between" flex={1}>
        {/* Main nav items */}
        <Stack p={12} gap={6}>
          {allItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={active}
              />
            );
          })}
        </Stack>

        {/* Bottom: Project Settings */}
        <Stack gap={4} px={12} pb={12}>
          <NavLink
            href="/settings"
            icon={IconSettings}
            label="Project Settings"
            active={pathname.startsWith("/settings")}
            className={`rounded-[10px] ${
              pathname.startsWith("/settings")
                ? "bg-octopush-surface"
                : "hover:bg-octopush-surface/50"
            }`}
          />
        </Stack>
      </Flex>
    </Stack>
  );
}
