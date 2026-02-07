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
        aria-label="Sign out"
        className="text-octopush-text-muted hover:text-octopush-text-primary"
      >
        <IconLogout size={20} />
      </ActionIcon>
    </form>
  );
}
