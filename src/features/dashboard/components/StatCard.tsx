import { Flex, Stack, Text } from "@mantine/core";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changeColor?: "green" | "yellow" | "red";
}

export function StatCard({
  label,
  value,
  change,
  changeColor = "green",
}: StatCardProps) {
  const colorMap = {
    green: "#22C55E",
    yellow: "#EAB308",
    red: "#EF4444",
  };

  return (
    <Stack
      gap={12}
      classNames={{
        root: "bg-octopush-gray-900 rounded-[14px] p-5 flex-1 min-w-0",
      }}
    >
      <Text fz={12} fw={500} c="#9CA3AF">
        {label}
      </Text>
      <Flex align="end" gap={8}>
        <Text fz={28} fw={700} c="var(--octopush-color-foreground)" lh={1}>
          {value}
        </Text>
        <Text fz={12} fw={500} c={colorMap[changeColor]} mb={2}>
          {change}
        </Text>
      </Flex>
    </Stack>
  );
}
