import Link from "next/link";
import { Text } from "@mantine/core";

type AuthFooterLinkProps = {
  text: string;
  linkText: string;
  href: string;
};

export function AuthFooterLink({ text, linkText, href }: AuthFooterLinkProps) {
  return (
    <Text fz={14} className="text-octopush-text-muted">
      {text}{" "}
      <Link
        href={href}
        className="font-semibold text-octopush-primary hover:underline"
      >
        {linkText}
      </Link>
    </Text>
  );
}
