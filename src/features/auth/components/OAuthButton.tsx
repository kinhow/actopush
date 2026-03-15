"use client";

import { Button } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { AUTH_OAUTH_BUTTON_CLASSES } from "../constants/styles";

interface OAuthButtonProps {
  action: () => void;
  label?: string;
  icon?: ReactNode;
}

export function OAuthButton({
  action,
  label = "Continue with Google",
  icon = <IconBrandGoogle size={20} />,
}: OAuthButtonProps) {
  return (
    <form action={action}>
      <Button
        type="submit"
        fullWidth
        radius="xl"
        h={40}
        variant="outline"
        leftSection={icon}
        classNames={AUTH_OAUTH_BUTTON_CLASSES}
      >
        {label}
      </Button>
    </form>
  );
}
