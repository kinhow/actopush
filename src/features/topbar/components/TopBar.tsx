import { Flex, Stack, Group, Text, TextInput, ActionIcon } from "@mantine/core";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import { getUser, getUserWithOrg } from "@/lib/supabase/queries";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function TopBar() {
  const user = await getUser();
  const profile = await getUserWithOrg(user!.id);

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
      px="xl"
      align="center"
      justify="space-between"
      classNames={{ root: "border-b border-octopush-divider" }}
    >
      {/* Left: Org name + subtitle */}
      <Stack gap={2}>
        <Text
          fw={700}
          fz="xl"
          c="var(--octopush-color-foreground)"
        >
          {orgName}'s Workspace
        </Text>
        <Text fz="sm" c="var(--octopush-color-foreground)">
          Welcome back! Here&apos;s your CRM overview.
        </Text>
      </Stack>

      {/* Right: Search + Add button + Avatar */}
      <Group gap="md">
        <TextInput
          placeholder="Search..."
          leftSection={<IconSearch size={16} className="text-octopush-muted" />}
          w={280}
          radius={2}
          classNames={{
            input:
              "border-octopush-divider bg-transparent text-sm placeholder:text-octopush-muted",
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

        <ThemeToggle />
        <SignOutButton />

        <Flex
          w={40}
          h={40}
          align="center"
          justify="center"
          classNames={{ root: "rounded-full border border-octopush-divider bg-octopush-elevated" }}
        >
          <Text
            fz="sm"
            fw={600}
            c="var(--octopush-color-foreground)"
          >
            {initials}
          </Text>
        </Flex>
      </Group>
    </Flex>
  );
}
