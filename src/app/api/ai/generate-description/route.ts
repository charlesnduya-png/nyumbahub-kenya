import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generatePropertyDescription } from "@/lib/ai";

const schema = z.object({
  title: z.string().min(5),
  propertyType: z.string(),
  listingType: z.string(),
  bedrooms: z.number().optional().nullable(),
  bathrooms: z.number().optional().nullable(),
  county: z.string(),
  town: z.string(),
  estate: z.string().optional().nullable(),
  price: z.number().positive(),
  amenities: z
    .object({
      parking: z.boolean().optional(),
      swimmingPool: z.boolean().optional(),
      furnished: z.boolean().optional(),
      security: z.boolean().optional(),
    })
    .optional(),
  highlights: z.array(z.string()).optional(),
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

    const description = await generatePropertyDescription(parsed.data);

    return NextResponse.json({ success: true, data: { description } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to generate description" },
      { status: 500 },
    );
  }
}
