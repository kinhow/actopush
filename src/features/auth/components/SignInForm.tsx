"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Flex,
  Stack,
  Center,
  Button,
  Divider,
  TextInput,
  PasswordInput,
} from "@mantine/core";
import { signIn } from "../actions/signin";
import { signInWithGoogle } from "../actions/oauth";
import type { SignInState } from "../types/state";
import {
  AUTH_INPUT_CLASSES,
  AUTH_DIVIDER_CLASSES,
  AUTH_PRIMARY_BUTTON_CLASSES,
} from "../constants/styles";
import { AuthHeader } from "./AuthHeader";
import { AuthFooterLink } from "./AuthFooterLink";
import { FormErrorAlert } from "./FormErrorAlert";
import { OAuthButton } from "./OAuthButton";

export function SignInForm() {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signIn,
    null
  );

  return (
    <Center mih="100vh" className="bg-octopush-background">
      <Stack w={400} gap={32} align="center">
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to your OctoPush account"
        />

        <Stack gap={16} w="100%">
          <FormErrorAlert message={state?.errors?.form} />

          <form action={formAction}>
            <Stack gap={16}>
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
                placeholder="Enter your password"
                radius="xl"
                error={state?.errors?.password}
                disabled={isPending}
                classNames={AUTH_INPUT_CLASSES}
              />

              <Flex justify="flex-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-octopush-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </Flex>

              <Button
                fullWidth
                radius="xl"
                type="submit"
                loading={isPending}
                classNames={AUTH_PRIMARY_BUTTON_CLASSES}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Divider label="or" labelPosition="center" classNames={AUTH_DIVIDER_CLASSES} />

          <OAuthButton action={signInWithGoogle} />
        </Stack>

        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign up"
          href="/signup"
        />
      </Stack>
    </Center>
  );
}
