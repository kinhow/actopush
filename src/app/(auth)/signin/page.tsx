"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signInWithGoogle, type SignInState } from "./actions";
import { IconBrandGoogle, IconAlertCircle } from "@tabler/icons-react";
import {
  Box,
  Flex,
  Text,
  Stack,
  Alert,
  Title,
  Center,
  Button,
  Divider,
  TextInput,
  PasswordInput,
} from "@mantine/core";

export default function SignInPage() {
  // React 19 useActionState for form state and pending
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signIn,
    null
  );

  return (
    <Center mih="100vh" className="bg-bee-background">
      <Stack w={400} gap={32} align="center">
        {/* Logo Area */}
        <Stack gap={12} align="center">
          <Box w={56} h={64}>
            <svg
              width="56"
              height="64"
              viewBox="0 0 56 64"
              fill="none"
              className="text-bee-logo"
            >
              <polygon
                points="28,0 48,10 48,30 28,40 8,30 8,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <polygon
                points="10,20 30,30 30,50 10,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <polygon
                points="46,20 26,30 26,50 46,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </Box>
          <Text fz={28} fw={700} className="text-bee-logo">
            LittleBee
          </Text>
        </Stack>

        {/* Form Header */}
        <Stack gap={8} align="center" w="100%">
          <Title order={2} fz={24} fw={700} ta="center" classNames={{ root: "text-bee-text-primary" }}>
            Welcome back
          </Title>
          <Text fz={14} ta="center" classNames={{ root: "text-bee-text-muted" }}>
            Sign in to your LittleBee account
          </Text>
        </Stack>

        {/* Form Error Alert */}
        {state?.errors?.form && (
          <Alert
            w="100%"
            radius="md"
            color="red"
            bg="var(--color-bee-error-bg)"
            icon={<IconAlertCircle size={16} />}
          >
            {state.errors.form}
          </Alert>
        )}

        {/* Forms Container */}
        <Stack gap={16} w="100%">
          {/* Sign In Form */}
          <form action={formAction}>
            <Stack gap={16}>
              {/* Email Field */}
              <TextInput
                name="email"
                label="Email"
                placeholder="Enter your email"
                type="email"
                radius="xl"
                error={state?.errors?.email}
                disabled={isPending}
                classNames={{
                  label: "text-bee-text-primary font-medium text-sm mb-1.5",
                  input: "h-10 bg-bee-background border-bee-input text-bee-text-primary",
                }}
              />

              {/* Password Field */}
              <PasswordInput
                name="password"
                label="Password"
                placeholder="Enter your password"
                radius="xl"
                error={state?.errors?.password}
                disabled={isPending}
                classNames={{
                  label: "text-bee-text-primary font-medium text-sm mb-1.5",
                  input: "h-10 bg-bee-background border-bee-input text-bee-text-primary",
                }}
              />

              {/* Forgot Password Link */}
              <Flex justify="flex-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-bee-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </Flex>

              {/* Sign In Button */}
              <Button
                fullWidth
                radius="xl"
                type="submit"
                loading={isPending}
                classNames={{
                  root: "bg-bee-primary ",
                  label: "text-bee-sidebar font-medium text-sm hover:opacity-90",
                }}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          {/* Divider */}
          <Divider
            label="or"
            labelPosition="center"
            classNames={{
              label: "text-bee-text-muted text-sm",
            }}
          />

          {/* Google Sign In - Separate Form */}
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              fullWidth
              radius="xl"
              h={40}
              variant="outline"
              leftSection={<IconBrandGoogle size={20} />}
              classNames={{
                label: "text-bee-text-primary font-medium text-sm",
                root: "bg-bee-background border-bee-border hover:bg-bee-elevated",
              }}
            >
              Continue with Google
            </Button>
          </form>
        </Stack>

        {/* Sign Up Link */}
        <Text fz={14} className="text-bee-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-bee-primary hover:underline"
          >
            Sign up
          </Link>
        </Text>
      </Stack>
    </Center>
  );
}
