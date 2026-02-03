import Link from "next/link";
import { Stack, Text, Title, Button, Center } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function AuthCodeErrorPage() {
  return (
    <Center mih="100vh" className="bg-bee-background">
      <Stack w={400} gap={24} align="center">
        <IconAlertCircle size={64} className="text-bee-error-text" />

        <Stack gap={8} align="center">
          <Title order={2} fz={24} fw={700} ta="center" className="text-bee-text-primary">
            Authentication Error
          </Title>
          <Text fz={14} ta="center" className="text-bee-text-muted">
            Sorry, we couldn&apos;t verify your authentication. Please try again.
          </Text>
        </Stack>

        <Button
          component={Link}
          href="/signin"
          fullWidth
          radius="xl"
          h={40}
          classNames={{
            root: "bg-bee-primary text-bee-sidebar font-medium text-sm hover:opacity-90",
          }}
        >
          Back to Sign In
        </Button>
      </Stack>
    </Center>
  );
}
