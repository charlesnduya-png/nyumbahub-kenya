import { BrandLogo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <BrandLogo showKenya size="lg" className="mb-8" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
