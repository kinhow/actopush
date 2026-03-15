import type { PropsWithChildren } from "react";
import { AuthLayout } from "@/features/auth/layout/AuthLayout";

export default function AuthRouteLayout({ children }: PropsWithChildren) {
  return <AuthLayout>{children}</AuthLayout>;
}
