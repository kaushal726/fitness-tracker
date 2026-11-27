/* What each release brought, for the "What's new" pop-up and the list in Profile. Newest first.
 *
 * Every release that is deployed adds an entry here and raises "version" in package.json to match; a test fails if
 * the two disagree, so an update cannot go out without its note. Write for the person using the app: what they can do
 * now, in plain words, not what changed in the code.
 */
export type ChangeKind = "new" | "better" | "fix";

export interface ReleaseChange {
  kind: ChangeKind;
  title: string;
  text: string;
}

export interface Release {
  /** The same as "version" in package.json when this is the newest release. */
  version: string;
  /** As shown: "22 Nov 2026", or the month when the day is not known. */
  date: string;
  title: string;
  changes: ReleaseChange[];
}

export const CHANGE_LABELS: Record<ChangeKind, string> = { new: "New", better: "Better", fix: "Fixed" };

export const RELEASES: Release[] = [
  {
    version: "1.2.0",
    date: "27 Nov 2026",
    title: "Back up your data, and a water goal that fits you",
    changes: [
      {
        kind: "new",
        title: "Sign in with Google (optional)",
        text: "Sign in and your food, water and weight are saved to your own account, so a new or lost phone loses nothing. Prefer not to? Choose Continue without an account and the app works as before.",
      },
      {
        kind: "new",
        title: "Water goal from your weight",
        text: "Your daily water goal is now worked out from your body weight and how active you are, and changes when they do. You can still set your own.",
      },
    ],
  },
  {
    version: "1.1.1",
    date: "24 Nov 2026",
    title: "A clearer calorie plan",
    changes: [
      {
        kind: "fix",
        title: "Timeline matches your plan",
        text: "When you change how long you give yourself, the pace shown now uses how active you really are, so it agrees with your daily calories.",
      },
      {
        kind: "better",
        title: "Why the calories did not change",
        text: "A timeline faster than is safe keeps your calories at the safe pace. The note now says so, instead of looking as if your change was ignored.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "22 Nov 2026",
    title: "Over a thousand new foods, and better search",
    changes: [
      {
        kind: "new",
        title: "More than 1,100 new foods",
        text: "Kachori, bara and pakoda types, many kinds of chocolate and chocolate sweets, street food and local dishes from every region, market and packaged foods. The app now knows over 18,500 foods.",
      },
      {
        kind: "better",
        title: "Search puts the plain food first",
        text: "A search shows the everyday food before a brand's product, so you get what you meant. Type the brand to find its products.",
      },
      {
        kind: "better",
        title: "Other spellings found too",
        text: "Over 240 foods now also answer to the other ways people spell them.",
      },
      {
        kind: "new",
        title: "What's new",
        text: "Every update now comes with a short note like this one. You can read them again any time in Profile.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "Nov 2026",
    title: "Sweets, reminders and a new look",
    changes: [
      {
        kind: "new",
        title: "Indian sweets and festival prasad",
        text: "Chhath prasad and thekua, panjiri, flavoured peda, barfi and ladoo, and many regional sweets.",
      },
      {
        kind: "better",
        title: "Meal cards show what you ate",
        text: "Breakfast, lunch, snack and dinner show only the calories eaten, with no target to reach.",
      },
      {
        kind: "new",
        title: "A new logo",
        text: "A leaf-and-flame logo for the app and its notifications.",
      },
      {
        kind: "new",
        title: "Reminders",
        text: "Gentle nudges to log your meals and drink water, and a weigh-in on Saturdays.",
      },
    ],
  },
];

export const latestRelease = (): Release => RELEASES[0];
