import { Stack, Title, Text } from "@mantine/core";

type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <Stack gap="xs" align="center" w="100%">
      <Title
        order={2}
        fz="xl"
        fw={700}
        ta="center"
        c="var(--octopush-color-foreground)"
      >
        {title}
      </Title>
      <Text fz="sm" ta="center" c="var(--octopush-color-foreground)">
        {subtitle}
      </Text>
    </Stack>
  );
}
