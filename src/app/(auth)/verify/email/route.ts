import { type NextRequest } from "next/server";
import { handleEmailConfirm } from "@/features/auth/handlers/confirm";

export async function GET(request: NextRequest) {
  return handleEmailConfirm(request);
}
