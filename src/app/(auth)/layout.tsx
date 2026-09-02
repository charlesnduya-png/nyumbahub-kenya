import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand/logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-[#071a14]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(11,110,79,0.45),transparent_55%),radial-gradient(ellipse_at_85%_70%,rgba(15,80,60,0.35),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-lg px-4 py-5 pb-10 sm:px-6 sm:py-8">
        <BrandLogo
          showKenya
          size="md"
          onDark
          className="mx-auto mb-5 shrink-0 sm:mb-7 sm:scale-110"
        />
        <div className="w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}
