import { Flex, Stack, Text } from "@mantine/core";
import {
  IconBolt,
  IconFileDescription,
  IconMessageCircle,
  IconSpeakerphone,
  IconUserPlus,
} from "@tabler/icons-react";
import { ActivityItem, type ActivityItemData } from "./ActivityItem";

const ACTIVITIES: ActivityItemData[] = [
  {
    icon: IconMessageCircle,
    iconColor: "#3B82F6",
    iconBg: "#3B82F620",
    title: "New conversation with Ahmad Razak",
    description: "3 minutes ago",
    time: "3m",
  },
  {
    icon: IconSpeakerphone,
    iconColor: "#10B981",
    iconBg: "#10B98120",
    title: "Campaign 'Raya Promo' completed — 1,240 sent",
    description: "12 minutes ago",
    time: "12m",
  },
  {
    icon: IconUserPlus,
    iconColor: "#A855F7",
    iconBg: "#A855F720",
    title: "New contact: Sarah Chan (+60123456789)",
    description: "28 minutes ago",
    time: "28m",
  },
  {
    icon: IconFileDescription,
    iconColor: "#F59E0B",
    iconBg: "#F59E0B20",
    title: "Template 'welcome_v2' rejected — Policy violation",
    description: "1 hour ago",
    time: "1h",
  },
  {
    icon: IconBolt,
    iconColor: "#FF2D55",
    iconBg: "#FF2D5520",
    title: "Flow 'Lead Capture' triggered for Mai Ling",
    description: "2 hours ago",
    time: "2h",
  },
];

export function ActivityFeed() {
  return (
    <Stack
      gap={16}
      classNames={{
        root: "bg-octopush-gray-900 rounded-[14px] p-5",
      }}
    >
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Text fz={14} fw={600} c="var(--octopush-color-foreground)">
          Recent Activity
        </Text>
        <Text
          fz={12}
          fw={500}
          c="var(--octopush-color-primary)"
          className="cursor-pointer"
        >
          View all
        </Text>
      </Flex>

      {/* Activity list */}
      <Stack gap={0}>
        {ACTIVITIES.map((activity) => (
          <ActivityItem key={activity.title} item={activity} />
        ))}
      </Stack>
    </Stack>
  );
}
