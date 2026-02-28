"use client";

import { Button } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";
import { AUTH_OAUTH_BUTTON_CLASSES } from "../constants/styles";

type OAuthButtonProps = {
  action: () => void;
  label?: string;
};

export function OAuthButton({
  action,
  label = "Continue with Google",
}: OAuthButtonProps) {
  return (
    <form action={action}>
      <Button
        type="submit"
        fullWidth
        radius="xl"
        h={40}
        variant="outline"
        leftSection={<IconBrandGoogle size={20} />}
        classNames={AUTH_OAUTH_BUTTON_CLASSES}
      >
        {label}
      </Button>
    </form>
  );
}
