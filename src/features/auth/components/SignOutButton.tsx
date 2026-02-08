import { ActionIcon } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { signOut } from "../actions/signout";

export function SignOutButton() {
  return (
    <form>
      <ActionIcon
        type="submit"
        formAction={signOut}
        variant="subtle"
        radius="xl"
        size={40}
        aria-label="Sign out"
        classNames={{ root: "text-octopush-muted hover:text-octopush-foreground" }}
      >
        <IconLogout size={20} />
      </ActionIcon>
    </form>
  );
}
