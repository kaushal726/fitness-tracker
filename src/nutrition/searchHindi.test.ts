import { describe, expect, it } from "vitest";
import { searchFood, searchFoodDetailed } from "./search.ts";

const ids = (query: string, limit = 5) => searchFood(query, { limit }).map((f) => f.id);

describe("search in Hindi phrasing", () => {
  it("ignores ka / ki / ke between the words", () => {
    for (const q of ["besan ka chila", "besan ka chilla", "besan chila"]) expect(ids(q, 3), q).toContain("besan_chilla");
    expect(ids("bhindi ki sabzi", 4)).toContain("bhindi_masala");
    expect(ids("aloo ke parathe", 3)).toContain("aloo_paratha");
    expect(ids("mooli ka paratha", 2)).toContain("mooli_paratha");
  });

  it("does not call it a near match when the particle was the only word that did not match", () => {
    expect(searchFoodDetailed("besan ka chilla").closest).toBe(false);
    expect(searchFoodDetailed("aloo ke parathe").closest).toBe(false);
  });

  it("still puts a food whose own name has the particle first", () => {
    expect(ids("besan ka halwa", 1)).toEqual(["besan_ka_halwa"]);
    expect(ids("maa ki dal", 1)).toEqual(["maa_ki_dal"]);
  });

  it("knows the other spellings of the same word", () => {
    expect(ids("rotiyan", 1)).toEqual(["roti"]);
    expect(ids("pyaz ke pakode", 3)).toContain("onion_pakora");
    expect(ids("chila", 3)).toContain("besan_chilla");
  });

  it("keeps a lone particle as a word instead of searching for nothing", () => {
    expect(() => searchFood("ka")).not.toThrow();
  });
});
