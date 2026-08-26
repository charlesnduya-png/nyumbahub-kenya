import { NextResponse } from "next/server";
import {
  SITEMAP_XML_HEADERS,
  getListingsSitemapEntries,
  renderSitemapXml,
  sitemapOriginFromRequest,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET(request: Request) {
  return new NextResponse(
    renderSitemapXml(
      await getListingsSitemapEntries(
        new Date(),
        sitemapOriginFromRequest(request),
      ),
    ),
    { headers: SITEMAP_XML_HEADERS },
  );
}
