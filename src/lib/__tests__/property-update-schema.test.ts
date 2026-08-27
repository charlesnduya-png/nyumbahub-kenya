import { describe, expect, it } from "vitest";
import { updatePropertySchema } from "@/lib/validations/property";

describe("updatePropertySchema", () => {
  it("does not invent empty images or false amenity flags on partial updates", () => {
    const parsed = updatePropertySchema.safeParse({
      id: "prop_1",
      status: "ARCHIVED",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data).toEqual({
      id: "prop_1",
      status: "ARCHIVED",
    });
    expect(parsed.data).not.toHaveProperty("images");
    expect(parsed.data).not.toHaveProperty("videos");
    expect(parsed.data).not.toHaveProperty("features");
    expect(parsed.data).not.toHaveProperty("parking");
    expect(parsed.data).not.toHaveProperty("country");
    expect(parsed.data).not.toHaveProperty("currency");
  });

  it("keeps explicitly sent media arrays", () => {
    const parsed = updatePropertySchema.safeParse({
      id: "prop_1",
      title: "Updated beach house title",
      images: [{ url: "https://cdn.example.com/a.jpg", isPrimary: true }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.images).toHaveLength(1);
    expect(parsed.data.title).toBe("Updated beach house title");
  });
});
