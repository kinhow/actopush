import { Button, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { AUTH_PRIMARY_BUTTON_CLASSES } from "../constants/styles";

export function AuthCodeError() {
  return (
    <>
      <IconAlertCircle size={64} className="text-octopush-error-foreground" />

      <Stack gap="xs" align="center">
        <Title
          order={2}
          fz="h2"
          fw="bolder"
          ta="center"
          c="var(--octopush-color-foreground)"
        >
          Authentication Error
        </Title>
        <Text fz="sm" ta="center" c="var(--octopush-color-foreground)">
          Sorry, we couldn&apos;t verify your authentication. Please try again.
        </Text>
      </Stack>

      <Link href="/signin" className="w-full no-underline">
        <Button
          fullWidth
          radius="xl"
          h={40}
          classNames={AUTH_PRIMARY_BUTTON_CLASSES}
        >
          Back to Sign In
        </Button>
      </Link>
    </>
  );
}
