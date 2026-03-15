import { Flex, Text } from "@mantine/core";

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Flex align="center" gap={6}>
      <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <Text fz={12} c="#9CA3AF">
        {label}
      </Text>
    </Flex>
  );
}
