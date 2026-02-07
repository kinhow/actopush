import Link from "next/link";
import { Stack, Text, Title, Button, Center } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { AUTH_PRIMARY_BUTTON_CLASSES } from "../constants/styles";

export function AuthCodeError() {
  return (
    <Center mih="100vh" className="bg-octopush-background">
      <Stack w={400} gap={24} align="center">
        <IconAlertCircle size={64} className="text-octopush-error-text" />

        <Stack gap={8} align="center">
          <Title
            order={2}
            fz={24}
            fw={700}
            ta="center"
            className="text-octopush-text-primary"
          >
            Authentication Error
          </Title>
          <Text fz={14} ta="center" className="text-octopush-text-muted">
            Sorry, we couldn&apos;t verify your authentication. Please try again.
          </Text>
        </Stack>

        <Button
          component={Link}
          href="/signin"
          fullWidth
          radius="xl"
          h={40}
          classNames={AUTH_PRIMARY_BUTTON_CLASSES}
        >
          Back to Sign In
        </Button>
      </Stack>
    </Center>
  );
}
