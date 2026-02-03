"use client";

import Link from "next/link";
import { useActionState } from "react";
import { IconBrandGoogle, IconAlertCircle } from "@tabler/icons-react";
import { signUp, signUpWithGoogle, type SignUpState } from "./actions";
import {
  Box,
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

export default function SignUpPage() {
  // React 19 useActionState for form state and pending
  const [state, formAction, isPending] = useActionState<SignUpState, FormData>(
    signUp,
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
          <Title order={2} fz={24} fw={700} ta="center" className="text-bee-text-primary">
            Create an account
          </Title>
          <Text fz={14} ta="center" className="text-bee-text-muted">
            Sign up to get started with LittleBee
          </Text>
        </Stack>

        {/* Form Error Alert */}
        {state?.errors?.form && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            w="100%"
            radius="md"
          >
            {state.errors.form}
          </Alert>
        )}

        {/* Forms Container */}
        <Stack gap={16} w="100%">
          {/* Sign Up Form */}
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
                placeholder="Create a password"
                radius="xl"
                error={state?.errors?.password}
                disabled={isPending}
                classNames={{
                  label: "text-bee-text-primary font-medium text-sm mb-1.5",
                  input: "h-10 bg-bee-background border-bee-input text-bee-text-primary",
                }}
              />

              {/* Confirm Password Field */}
              <PasswordInput
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                radius="xl"
                error={state?.errors?.confirmPassword}
                disabled={isPending}
                classNames={{
                  label: "text-bee-text-primary font-medium text-sm mb-1.5",
                  input: "h-10 bg-bee-background border-bee-input text-bee-text-primary",
                }}
              />

              {/* Sign Up Button */}
              <Button
                type="submit"
                fullWidth
                radius="xl"
                h={40}
                loading={isPending}
                classNames={{
                  root: "bg-bee-primary text-bee-sidebar font-medium text-sm hover:opacity-90",
                }}
              >
                Sign Up
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

          {/* Google Sign Up - Separate Form */}
          <form action={signUpWithGoogle}>
            <Button
              fullWidth
              radius="xl"
              type="submit"
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

        {/* Sign In Link */}
        <Text fz={14} className="text-bee-text-muted">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-bee-primary hover:underline"
          >
            Sign in
          </Link>
        </Text>
      </Stack>
    </Center>
  );
}
