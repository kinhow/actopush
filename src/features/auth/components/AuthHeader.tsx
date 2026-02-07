import { Stack, Title, Text } from "@mantine/core";

type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <Stack gap={8} align="center" w="100%">
      <Title
        order={2}
        fz={24}
        fw={700}
        ta="center"
        classNames={{ root: "text-octopush-text-primary" }}
      >
        {title}
      </Title>
      <Text fz={14} ta="center" classNames={{ root: "text-octopush-text-muted" }}>
        {subtitle}
      </Text>
    </Stack>
  );
}
