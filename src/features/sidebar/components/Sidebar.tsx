import Link from "next/link";
import MainLogo from "@/components/MainLogo";
import { IconChevronDown } from "@tabler/icons-react";
import { Flex, Stack, Text, Group, ScrollArea } from "@mantine/core";
import { createClient } from "@/lib/supabase/server";
import { NAV_SECTIONS } from "../constants/navigation";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Query user profile for footer display
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user!.id)
    .single();

  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "User";
  const displayEmail = profile?.email ?? user?.email ?? "";

  return (
    <Stack
      component="aside"
      gap={24}
      h="100%"
      w={280}
      className="border-r border-octopush-border bg-octopush-surface"
    >
      {/* Header */}
      <Flex
        direction="column"
        justify="center"
        h={88}
        px={32}
        py={24}
        className="border-b border-octopush-border"
      >
        <Group gap={8}>
          <MainLogo size="size-7" />
          <Text fw={700} size="lg" c="var(--octopush-color-logo)" lineClamp={1}>
            OctoPush
          </Text>
        </Group>
      </Flex>

      {/* Content */}
      <ScrollArea component="nav" flex={1} px={16}>
        {NAV_SECTIONS.map((section) => (
          <Stack key={section.label} gap={0}>
            <Text size="sm" p={16} c="var(--octopush-color-text-secondary)">
              {section.label}
            </Text>
            <Stack gap={0}>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full no-underline transition-colors ${
                    item.active
                      ? "bg-octopush-elevated text-octopush-primary"
                      : "text-octopush-text-secondary hover:bg-octopush-elevated/50 hover:text-octopush-text-primary"
                  }`}
                >
                  <Group gap={16} px={16} py={12} wrap="nowrap">
                    <item.icon size={24} stroke={1.5} />
                    <Text size="md" inherit>
                      {item.label}
                    </Text>
                  </Group>
                </Link>
              ))}
            </Stack>
          </Stack>
        ))}
      </ScrollArea>

      {/* Footer */}
      <Group gap={8} px={32} py={24} align="center">
        <Stack gap={4} flex={1}>
          <Text size="md" c="var(--octopush-color-primary)">
            {displayName}
          </Text>
          <Text size="md" c="var(--octopush-color-text-secondary)">
            {displayEmail}
          </Text>
        </Stack>
        <IconChevronDown size={24} className="text-octopush-text-secondary" />
      </Group>
    </Stack>
  );
}
