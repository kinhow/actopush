import { Center, Stack } from "@mantine/core";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Center mih="100vh" bg="var(--octopush-color-base)">
      <Stack w={400} gap="xl" align="center">
        {children}
      </Stack>
    </Center>
  );
}
