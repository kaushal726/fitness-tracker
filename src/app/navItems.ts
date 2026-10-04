import type { IconType } from "react-icons";
import { IconHistory, IconInsights, IconProfile, IconScale, IconToday } from "../ui/icons";

export type TabId = "today" | "history" | "insights" | "body" | "profile";

export const NAV_ITEMS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "today", label: "Today", icon: IconToday },
  { id: "history", label: "History", icon: IconHistory },
  { id: "insights", label: "Insights", icon: IconInsights },
  { id: "body", label: "Body", icon: IconScale },
  { id: "profile", label: "Profile", icon: IconProfile },
];
