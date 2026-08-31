import { LazyChatAssistant } from "@/components/ai/lazy-chat-assistant";
import { SignInSavePopup } from "@/components/auth/signin-save-popup";
import { SiteVisitTracker } from "@/components/analytics/site-visit-tracker";
import { CurrencyProvider } from "@/components/currency/currency-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <div className="flex min-h-screen flex-col">
        <SiteVisitTracker />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <LazyChatAssistant />
        <SignInSavePopup />
      </div>
    </CurrencyProvider>
  );
}
