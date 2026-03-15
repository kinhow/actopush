import { Flex } from "@mantine/core";
import { StatCard } from "./StatCard";

const METRICS = [
  { label: "Total Contacts", value: "2,847", change: "+12.5%" },
  { label: "Active Conversations", value: "156", change: "+8.2%" },
  { label: "Messages Today", value: "1,234", change: "+24.1%" },
  { label: "Avg Response Time", value: "3m 42s", change: "-15.3%" },
  { label: "Template Approval", value: "87%", change: "+5.2%" },
  {
    label: "Unassigned",
    value: "23",
    change: "+3",
    changeColor: "yellow" as const,
  },
];

export function MetricsRow() {
  return (
    <Flex gap={16} w="100%">
      {METRICS.map((metric) => (
        <StatCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          change={metric.change}
          changeColor={metric.changeColor ?? "green"}
        />
      ))}
    </Flex>
  );
}
