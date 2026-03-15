import { Flex, Stack, Text } from "@mantine/core";
import type { ComponentType } from "react";

export interface ActivityItemData {
  icon: ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  time: string;
}

export function ActivityItem({ item }: { item: ActivityItemData }) {
  const Icon = item.icon;

  return (
    <Flex
      gap={12}
      align="center"
      py={12}
      classNames={{
        root: "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-octopush-divider",
      }}
    >
      <Flex
        w={32}
        h={32}
        align="center"
        justify="center"
        classNames={{ root: "rounded-full shrink-0" }}
        style={{ backgroundColor: item.iconBg }}
      >
        <Icon size={16} color={item.iconColor} />
      </Flex>

      <Stack gap={2} flex={1} classNames={{ root: "min-w-0" }}>
        <Text
          fz={13}
          fw={500}
          c="var(--octopush-color-foreground)"
          lineClamp={1}
        >
          {item.title}
        </Text>
        <Text fz={12} c="#9CA3AF">
          {item.description}
        </Text>
      </Stack>
    </Flex>
  );
}
