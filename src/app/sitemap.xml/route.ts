import { NextResponse } from "next/server";
import {
  SITEMAP_XML_HEADERS,
  getSitemapEntries,
  renderSitemapXml,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const xml = renderSitemapXml(await getSitemapEntries());
  return new NextResponse(xml, {
    headers: SITEMAP_XML_HEADERS,
  });
}
