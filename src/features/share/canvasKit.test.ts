import { describe, expect, it } from "vitest";
import { type Ctx, wrapList } from "./canvasKit.ts";

/** A pretend canvas where every character is 10 pixels wide. */
const ctx = { measureText: (text: string) => ({ width: text.length * 10 }) } as unknown as Ctx;

describe("a list of foods in the picture", () => {
  it("breaks between foods, never inside one, and keeps every food", () => {
    expect(wrapList(ctx, ["Poha", "Masala Chai", "Banana"], 200, 5)).toEqual(["Poha, Masala Chai,", "Banana"]);
  });

  it("keeps a name with a comma in it whole", () => {
    expect(wrapList(ctx, ["Filter Coffee (Oat, Jaggery)", "Idli"], 400, 5)).toEqual(["Filter Coffee (Oat, Jaggery), Idli"]);
  });

  it("says how many more there are past the last line", () => {
    const lines = wrapList(ctx, ["Aaaaaa", "Bbbbbb", "Cccccc", "Dddddd", "Eeeeee"], 180, 2);
    expect(lines).toEqual(["Aaaaaa, Bbbbbb,", "Cccccc and 2 more"]);
  });
});
