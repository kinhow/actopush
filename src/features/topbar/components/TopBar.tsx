import { Flex, Stack, Group, Text, TextInput, ActionIcon } from "@mantine/core";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";

export async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, org_memberships(organizations(name))")
    .eq("id", user!.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- nested join types not generated
  const membership = profile?.org_memberships?.[0] as any;
  const orgName: string = membership?.organizations?.name ?? "My Workspace";

  const fullName = profile?.full_name ?? user?.email?.split("@")[0] ?? "U";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Flex
      h={80}
      px={32}
      align="center"
      justify="space-between"
      className="border-b border-octopush-border"
    >
      {/* Left: Org name + subtitle */}
      <Stack gap={2}>
        <Text
          fw={700}
          fz={24}
          c="var(--octopush-color-text-primary)"
        >
          {orgName}'s Workspace
        </Text>
        <Text fz={14} c="var(--octopush-color-text-muted)">
          Welcome back! Here&apos;s your CRM overview.
        </Text>
      </Stack>

      {/* Right: Search + Add button + Avatar */}
      <Group gap={16}>
        <TextInput
          placeholder="Search..."
          leftSection={<IconSearch size={16} className="text-octopush-text-muted" />}
          w={280}
          radius={2}
          classNames={{
            input:
              "border-octopush-border bg-transparent text-sm placeholder:text-octopush-text-muted",
          }}
          readOnly
        />

        <ActionIcon
          variant="filled"
          color="var(--octopush-color-primary)"
          radius="xl"
          size={40}
        >
          <IconPlus size={20} color="white" />
        </ActionIcon>

        <Flex
          w={40}
          h={40}
          align="center"
          justify="center"
          className="rounded-full border border-octopush-border bg-octopush-elevated"
        >
          <Text
            fz={14}
            fw={600}
            c="var(--octopush-color-text-primary)"
          >
            {initials}
          </Text>
        </Flex>
      </Group>
    </Flex>
  );
}
