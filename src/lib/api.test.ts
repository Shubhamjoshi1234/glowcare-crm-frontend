import { describe, expect, it } from "vitest";
import { queryString } from "./api";

describe("queryString", () => {
  it("encodes populated values and omits empty filters", () => {
    expect(
      queryString({
        search: "night cream",
        page: 2,
        city: "",
        category: undefined,
      }),
    ).toBe("?search=night+cream&page=2");
  });

  it("returns an empty string when no filters are active", () => {
    expect(queryString({ search: "", page: undefined })).toBe("");
  });
});
