import { Box, Text, Stack } from "@mantine/core";
import MantineLogo from "@/components/MainLogo";

export function AuthLogo() {
  return (
    <Stack gap={12} align="center">
      <MantineLogo size="size-40" />
      <Text fz={28} fw={700} c="var(--octopush-color-logo)">
        OctoPush
      </Text>
    </Stack>
  );
}
