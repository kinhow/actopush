"use client";

import { ActionIcon } from "@mantine/core";
import { useMounted } from "@mantine/hooks";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useMantineColorScheme, useComputedColorScheme } from "@mantine/core";

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
      aria-label="Toggle color scheme"
    >
      {mounted && colorScheme === "dark" ? (
        <IconSun size={20} />
      ) : (
        <IconMoon size={20} />
      )}
    </ActionIcon>
  );
}
