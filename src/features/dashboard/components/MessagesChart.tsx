import { Flex, Stack, Text } from "@mantine/core";
import { Bar } from "./Bar";
import { LegendDot } from "./LegendDot";

const DAYS = [
  { label: "Mon", sent: 60, received: 45 },
  { label: "Tue", sent: 70, received: 55 },
  { label: "Wed", sent: 45, received: 35 },
  { label: "Thu", sent: 80, received: 65 },
  { label: "Fri", sent: 65, received: 50 },
  { label: "Sat", sent: 90, received: 72 },
  { label: "Sun", sent: 50, received: 40 },
];

const MAX_HEIGHT = 180;
const maxVal = Math.max(...DAYS.flatMap((d) => [d.sent, d.received]));

export function MessagesChart() {
  return (
    <Stack
      gap={16}
      classNames={{
        root: "bg-octopush-gray-900 rounded-[14px] p-5 flex-1 min-w-0",
      }}
    >
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Text fz={14} fw={600} c="var(--octopush-color-foreground)">
          Messages Over Time
        </Text>
        <Flex gap={16}>
          <LegendDot color="#FF2D55" label="Sent" />
          <LegendDot color="#6366F1" label="Received" />
        </Flex>
      </Flex>

      {/* Chart */}
      <Flex gap={0} align="end" h={MAX_HEIGHT} w="100%">
        {DAYS.map((day) => (
          <Flex
            key={day.label}
            align="end"
            gap={2}
            flex={1}
            h="100%"
            justify="center"
          >
            <Bar
              height={day.sent}
              color="#FF2D55"
              maxVal={maxVal}
              maxHeight={MAX_HEIGHT}
            />
            <Bar
              height={day.received}
              color="#6366F1"
              maxVal={maxVal}
              maxHeight={MAX_HEIGHT}
            />
          </Flex>
        ))}
      </Flex>

      {/* Day labels */}
      <Flex justify="space-around" w="100%">
        {DAYS.map((day) => (
          <Text key={day.label} fz={10} c="#6B7280" ta="center" flex={1}>
            {day.label}
          </Text>
        ))}
      </Flex>
    </Stack>
  );
}
