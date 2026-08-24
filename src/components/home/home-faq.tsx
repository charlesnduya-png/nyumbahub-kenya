import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HOME_FAQ_ITEMS } from "@/lib/seo";

export function HomeFaq() {
  return (
    <section
      className="cv-auto border-t bg-card/50 py-16"
      aria-labelledby="home-faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2
          id="home-faq-heading"
          className="font-display text-center text-3xl font-semibold tracking-tight"
        >
          Frequently asked questions
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Common questions about buying, renting, and listing property in Africa.
        </p>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {HOME_FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
