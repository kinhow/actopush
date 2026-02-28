import { handleOAuthCallback } from "@/features/auth/handlers/callback";

export async function GET(request: Request) {
  return handleOAuthCallback(request);
}
