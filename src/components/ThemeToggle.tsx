"use client";

import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useMounted } from "@mantine/hooks";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ThemeToggle() {
  const mounted = useMounted();

  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme("light");

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  return (
    <ActionIcon
      onClick={toggleColorScheme}
      variant="subtle"
      radius="xl"
      size={40}
      aria-label="Toggle color scheme"
    >
      {mounted ? (
        colorScheme === "dark" ? (
          <IconSun size={20} />
        ) : (
          <IconMoon size={20} />
        )
      ) : (
        <IconMoon size={20} />
      )}
    </ActionIcon>
  );
}
