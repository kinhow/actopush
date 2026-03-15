import { Flex, Stack } from "@mantine/core";
import { ActivityFeed } from "@/features/dashboard/components/ActivityFeed";
import { ConversationStatus } from "@/features/dashboard/components/ConversationStatus";
import { MessagesChart } from "@/features/dashboard/components/MessagesChart";
import { MetricsRow } from "@/features/dashboard/components/MetricsRow";

export default function DashboardPage() {
  return (
    <Stack gap={24} p={24} h="100%">
      {/* Metrics Row */}
      <MetricsRow />

      {/* Charts Row */}
      <Flex gap={16}>
        <MessagesChart />
        <ConversationStatus />
      </Flex>

      {/* Activity Feed */}
      <ActivityFeed />
    </Stack>
  );
}
