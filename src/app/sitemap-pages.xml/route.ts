import { NextResponse } from "next/server";
import {
  SITEMAP_XML_HEADERS,
  getPagesSitemapEntries,
  renderSitemapXml,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  return new NextResponse(renderSitemapXml(getPagesSitemapEntries()), {
    headers: SITEMAP_XML_HEADERS,
  });
}
