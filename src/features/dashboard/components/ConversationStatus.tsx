import { Flex, Stack, Text } from "@mantine/core";

const SEGMENTS = [
  { label: "Sent", value: 161, color: "#10B981" },
  { label: "Pending", value: 63, color: "#F59E0B" },
  { label: "Replied", value: 89, color: "#6366F1" },
  { label: "Expired", value: 19, color: "#5A5A65" },
];

const TOTAL = SEGMENTS.reduce((sum, s) => sum + s.value, 0);

function buildConicGradient(): string {
  let current = 0;
  const stops: string[] = [];
  for (const seg of SEGMENTS) {
    const pct = (seg.value / TOTAL) * 100;
    stops.push(`${seg.color} ${current}% ${current + pct}%`);
    current += pct;
  }
  return `conic-gradient(${stops.join(", ")})`;
}

export function ConversationStatus() {
  return (
    <Stack
      gap={16}
      w={340}
      classNames={{
        root: "bg-octopush-gray-900 rounded-[14px] p-5 shrink-0",
      }}
    >
      <Text fz={14} fw={600} c="var(--octopush-color-foreground)">
        Conversation Status
      </Text>

      {/* Donut chart */}
      <Flex justify="center" py={8}>
        <div
          className="relative rounded-full"
          style={{
            width: 140,
            height: 140,
            background: buildConicGradient(),
          }}
        >
          {/* Inner cutout */}
          <div
            className="absolute rounded-full bg-octopush-gray-900 flex items-center justify-center flex-col"
            style={{
              width: 90,
              height: 90,
              top: 25,
              left: 25,
            }}
          >
            <Text fz={24} fw={700} c="var(--octopush-color-foreground)" lh={1}>
              {TOTAL}
            </Text>
            <Text fz={10} c="#9CA3AF" mt={2}>
              Total
            </Text>
          </div>
        </div>
      </Flex>

      {/* Legend */}
      <Stack gap={8}>
        {SEGMENTS.map((seg) => (
          <Flex key={seg.label} justify="space-between" align="center">
            <Flex align="center" gap={8}>
              <div
                className="size-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <Text fz={12} c="#9CA3AF">
                {seg.label}
              </Text>
            </Flex>
            <Text fz={12} fw={500} c="var(--octopush-color-foreground)">
              {seg.value}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Stack>
  );
}
