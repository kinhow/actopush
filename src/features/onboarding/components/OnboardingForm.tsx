"use client";

import { useActionState } from "react";
import { Stack, Center, Button, TextInput } from "@mantine/core";
import { createOrganization } from "../actions/create-organization";
import type { OnboardingState } from "../types/state";
import {
  AUTH_INPUT_CLASSES,
  AUTH_PRIMARY_BUTTON_CLASSES,
} from "@/features/auth/constants/styles";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { FormErrorAlert } from "@/features/auth/components/FormErrorAlert";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState<
    OnboardingState,
    FormData
  >(createOrganization, null);

  return (
    <Center mih="100vh" className="bg-octopush-background">
      <Stack w={400} gap={32} align="center">
        <SignOutButton />
        <AuthHeader
          title="Set up your workspace"
          subtitle="Give your organization a name to get started"
        />

        <Stack gap={16} w="100%">
          <FormErrorAlert message={state?.errors?.form} />

          <form action={formAction}>
            <Stack gap={16}>
              <TextInput
                name="fullName"
                label="Full Name"
                placeholder="Enter your full name"
                radius="xl"
                error={state?.errors?.fullName}
                disabled={isPending}
                classNames={AUTH_INPUT_CLASSES}
              />

              <TextInput
                name="orgName"
                label="Organization Name"
                placeholder="e.g. Acme Inc."
                radius="xl"
                error={state?.errors?.orgName}
                disabled={isPending}
                classNames={AUTH_INPUT_CLASSES}
              />

              <Button
                type="submit"
                fullWidth
                radius="xl"
                h={40}
                loading={isPending}
                classNames={AUTH_PRIMARY_BUTTON_CLASSES}
              >
                Create Workspace
              </Button>
            </Stack>
          </form>
        </Stack>
      </Stack>
    </Center>
  );
}
