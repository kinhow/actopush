import { signOut } from "./actions";
import { ActionIcon } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";

export function SignOut() {
  return (
    <form>
      <ActionIcon
        type="submit"
        formAction={signOut}
        variant="subtle"
        aria-label="Sign out"
        className="text-bee-text-muted hover:text-bee-text-primary"
      >
        <IconLogout size={20} />
      </ActionIcon>
    </form>
  );
}
