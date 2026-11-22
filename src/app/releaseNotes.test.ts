import { describe, expect, it } from "vitest";
import { CHANGE_LABELS, latestRelease, RELEASES } from "./releaseNotes.ts";
import { shouldShowReleaseNotes } from "./releaseSeen.ts";

const parts = (v: string): number[] => v.split(".").map(Number);
const compare = (a: string, b: string): number => {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

describe("release notes", () => {
  it("has a note for the version being built, so an update cannot ship without one", () => {
    expect(latestRelease().version).toBe(__APP_VERSION__);
  });

  it("lists releases newest first, each version once", () => {
    const versions = RELEASES.map((r) => r.version);
    expect(new Set(versions).size).toBe(versions.length);
    for (let i = 1; i < versions.length; i++) expect(compare(versions[i - 1], versions[i])).toBeGreaterThan(0);
  });

  it("gives every release a title, a date and changes that say what they are", () => {
    for (const release of RELEASES) {
      expect(release.title.trim(), release.version).not.toBe("");
      expect(release.date.trim(), release.version).not.toBe("");
      expect(release.changes.length, release.version).toBeGreaterThan(0);
      for (const change of release.changes) {
        expect(CHANGE_LABELS[change.kind], change.title).toBeDefined();
        expect(change.title.trim(), release.version).not.toBe("");
        expect(change.text.trim(), change.title).not.toBe("");
      }
    }
  });

  it("uses no emoji", () => {
    const text = RELEASES.flatMap((r) => [r.title, ...r.changes.flatMap((c) => [c.title, c.text])]).join(" ");
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe("when the note is shown", () => {
  const latest = "1.1.0";
  it("shows it once to someone who has the app and has not seen this release", () => {
    expect(shouldShowReleaseNotes({ seen: null, latest, hasProfile: true })).toBe(true);
    expect(shouldShowReleaseNotes({ seen: "1.0.0", latest, hasProfile: true })).toBe(true);
    expect(shouldShowReleaseNotes({ seen: latest, latest, hasProfile: true })).toBe(false);
  });

  it("does not show it to someone still setting the app up", () => {
    expect(shouldShowReleaseNotes({ seen: null, latest, hasProfile: false })).toBe(false);
  });
});
