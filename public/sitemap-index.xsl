<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="sm">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <title>Your Home sitemap index</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #f4f7f5; color: #12241c; margin: 0; }
          header { background: #0b6e4f; color: #fff; padding: 28px 24px; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          p { margin: 0; opacity: .92; }
          main { max-width: 900px; margin: 0 auto; padding: 24px; }
          .note { background: #fff; border: 1px solid #d7e4dc; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; }
          th { text-align: left; background: #e8f3ee; padding: 12px; font-size: 13px; }
          td { padding: 12px; border-top: 1px solid #edf2ef; font-size: 14px; word-break: break-all; }
          a { color: #0b6e4f; font-weight: 600; }
        </style>
      </head>
      <body>
        <header>
          <h1>Your Home sitemap index</h1>
          <p>Submit this file in Google Search Console. It points Google to every sitemap below.</p>
        </header>
        <main>
          <div class="note">
            The browser message about missing style information is harmless. Search engines use the XML, not this page layout.
          </div>
          <table>
            <thead>
              <tr>
                <th>Sitemap</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:sitemapindex/sm:sitemap">
                <tr>
                  <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                  <td><xsl:value-of select="sm:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
