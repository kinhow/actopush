import MainLogo from "@/components/MainLogo";
import { IconChevronDown } from "@tabler/icons-react";
import { Flex, Stack, Text, Group } from "@mantine/core";
import { getUser, getUserProfile } from "@/lib/supabase/queries";
import { SidebarNav } from "./SidebarNav";

export async function Sidebar() {
  const user = await getUser();
  const profile = await getUserProfile(user!.id);

  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "User";
  const displayEmail = profile?.email ?? user?.email ?? "";

  return (
    <Stack
      w="300"
      h="100%"
      component="aside"
      classNames={{ root: "border-r border-octopush-divider bg-octopush-surface" }}
    >
      {/* Header */}
      <Flex
        direction="column"
        justify="center"
        h={88}
        px="xl"
        py="lg"
      >
        <Group gap="xs">
          <MainLogo size="size-7" />
          <Text fw={700} size="lg" c="var(--octopush-color-primary)" lineClamp={1}>
            OctoPush
          </Text>
        </Group>
      </Flex>

      {/* Content */}
      <SidebarNav />

      {/* Footer */}
      <Group gap="xs" px="xl" py="lg" align="center">
        <Stack gap={4} flex={1}>
          <Text size="md" c="var(--octopush-color-primary)">
            {displayName}
          </Text>
          <Text size="md" c="var(--octopush-color-subtle)">
            {displayEmail}
          </Text>
        </Stack>
        <IconChevronDown size={24} className="text-octopush-subtle" />
      </Group>
    </Stack>
  );
}
