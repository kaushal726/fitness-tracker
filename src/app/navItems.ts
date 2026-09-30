import type { IconType } from "react-icons";
import { IconHistory, IconProfile, IconToday } from "../ui/icons";

export type TabId = "today" | "history" | "profile";

export const NAV_ITEMS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "today", label: "Today", icon: IconToday },
  { id: "history", label: "History", icon: IconHistory },
  { id: "profile", label: "Profile", icon: IconProfile },
];
