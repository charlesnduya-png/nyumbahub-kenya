import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { suggestPrice } from "@/lib/ai";

const schema = z.object({
  propertyType: z.string(),
  listingType: z.string(),
  bedrooms: z.number().optional().nullable(),
  bathrooms: z.number().optional().nullable(),
  county: z.string(),
  town: z.string(),
  floorArea: z.number().optional().nullable(),
  plotSize: z.number().optional().nullable(),
  furnished: z.boolean().optional(),
  swimmingPool: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 },
      );
    }

    const suggestion = await suggestPrice(parsed.data);

    return NextResponse.json({ success: true, data: suggestion });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to suggest price" },
      { status: 500 },
    );
  }
}
