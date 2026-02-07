import {
  IconLayoutDashboard,
  IconAddressBook,
  IconMessageCircle,
  IconSpeakerphone,
  IconGitBranch,
  IconFilter,
  IconFileDescription,
} from "@tabler/icons-react";
import type { NavSection } from "../types/navigation";

/**
 * Sidebar navigation sections with their items
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { icon: IconLayoutDashboard, label: "Dashboard", href: "/", active: true },
      { icon: IconAddressBook, label: "Contacts", href: "/contacts" },
      { icon: IconMessageCircle, label: "Conversations", href: "/conversations" },
      { icon: IconSpeakerphone, label: "Campaigns", href: "/campaigns" },
    ],
  },
  {
    label: "Automation",
    items: [
      { icon: IconGitBranch, label: "Flows", href: "/flows" },
      { icon: IconFilter, label: "Segments", href: "/segments" },
      { icon: IconFileDescription, label: "Templates", href: "/templates" },
    ],
  },
];
