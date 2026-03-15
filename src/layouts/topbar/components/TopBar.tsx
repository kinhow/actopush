import { Flex, Group, Text } from "@mantine/core";
import {
  IconChevronDown,
  IconLifebuoy,
  IconSearch,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { getUser, getUserWithOrg } from "@/lib/supabase/queries";
import { PillButton } from "./PillButton";

export async function TopBar() {
  const user = await getUser();
  const profile = user ? await getUserWithOrg(user.id) : null;

  type OrgMembership = { organizations: { name: string } | null };
  const membership = profile?.org_memberships?.[0] as OrgMembership | undefined;
  const orgName = membership?.organizations?.name ?? "My Workspace";

  const fullName = profile?.full_name ?? user?.email?.split("@")[0] ?? "U";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 1);

  return (
    <Flex
      py={8}
      px={16}
      align="center"
      justify="space-between"
      classNames={{
        root: "border-b border-octopush-divider bg-octopush-base",
      }}
    >
      {/* Left: Brand icon + workspace name + chevron */}
      <Group gap={8}>
        <Text fw={600} fz={13} c="var(--octopush-color-foreground)">
          {orgName}&apos;s workspace
        </Text>
        <IconChevronDown size={14} className="text-octopush-muted" />
      </Group>

      {/* Right: Feedback + Search + Icons + Avatar */}
      <Group gap={12}>
        <PillButton>
          <Text fz={12} fw={500} c="var(--octopush-color-subtle)">
            Feedback
          </Text>
        </PillButton>

        <PillButton gap={8}>
          <IconSearch size={14} className="text-octopush-muted" />
          <Text fz={12} c="var(--octopush-color-muted)">
            Search...
          </Text>
          <Flex
            align="center"
            classNames={{
              root: "rounded bg-octopush-surface px-1.5 py-0.5 border border-octopush-divider",
            }}
          >
            <Text fz={10} c="var(--octopush-color-muted)">
              ⌘K
            </Text>
          </Flex>
        </PillButton>

        <IconLifebuoy
          size={18}
          className="text-octopush-muted cursor-pointer"
        />
        <IconUserPlus
          size={18}
          className="text-octopush-muted cursor-pointer"
        />
        <IconSettings
          size={18}
          className="text-octopush-muted cursor-pointer"
        />

        <ThemeToggle />
        <SignOutButton />

        <Flex
          w={26}
          h={26}
          align="center"
          justify="center"
          classNames={{
            root: "rounded-full bg-octopush-primary cursor-pointer",
          }}
        >
          <Text fz={11} fw={600} c="white">
            {initials}
          </Text>
        </Flex>
      </Group>
    </Flex>
  );
}
