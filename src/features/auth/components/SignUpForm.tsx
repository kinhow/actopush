"use client";

import {
  Alert,
  Button,
  Divider,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconMailCheck } from "@tabler/icons-react";
import { useActionState } from "react";
import { signInWithGoogle } from "../actions/oauth";
import { signUp } from "../actions/signup";
import {
  AUTH_DIVIDER_CLASSES,
  AUTH_INPUT_CLASSES,
  AUTH_PRIMARY_BUTTON_CLASSES,
} from "../constants/styles";
import type { SignUpState } from "../types/state";
import { AuthFooterLink } from "./AuthFooterLink";
import { AuthHeader } from "./AuthHeader";
import { FormErrorAlert } from "./FormErrorAlert";
import { OAuthButton } from "./OAuthButton";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState<SignUpState, FormData>(
    signUp,
    null,
  );

  if (state?.success) {
    return (
      <>
        <AuthHeader
          title="Check your email"
          subtitle="We've sent you a confirmation link"
        />

        <Alert
          w="100%"
          radius="md"
          color="green"
          bg="var(--octopush-color-success)"
          icon={<IconMailCheck size={16} />}
        >
          {state.message}
        </Alert>

        <AuthFooterLink
          text="Already have an account?"
          linkText="Sign in"
          href="/signin"
        />
      </>
    );
  }

  return (
    <>
      <AuthHeader
        title="Create an account"
        subtitle="Sign up to get started with OctoPush"
      />

      <Stack gap="md" w="100%">
        <FormErrorAlert message={state?.errors?.form} />

        <form action={formAction}>
          <Stack gap="md">
            <TextInput
              name="email"
              label="Email"
              placeholder="Enter your email"
              type="email"
              radius="xl"
              error={state?.errors?.email}
              disabled={isPending}
              classNames={AUTH_INPUT_CLASSES}
            />

            <PasswordInput
              name="password"
              label="Password"
              placeholder="Create a password"
              radius="xl"
              error={state?.errors?.password}
              disabled={isPending}
              classNames={AUTH_INPUT_CLASSES}
            />

            <PasswordInput
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              radius="xl"
              error={state?.errors?.confirmPassword}
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
              Sign Up
            </Button>
          </Stack>
        </form>

        <Divider
          label="or"
          labelPosition="center"
          classNames={AUTH_DIVIDER_CLASSES}
        />

        <OAuthButton action={signInWithGoogle} />
      </Stack>

      <AuthFooterLink
        text="Already have an account?"
        linkText="Sign in"
        href="/signin"
      />
    </>
  );
}
