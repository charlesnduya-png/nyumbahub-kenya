import { NextResponse } from "next/server";
import { getSitemapEntries, renderSitemapXml } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const xml = renderSitemapXml(await getSitemapEntries());
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
