import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is this video downloader free?",
    answer: "Yes, V-Downloader is 100% free to use. We do not require any subscriptions or payments for downloading videos.",
  },
  {
    question: "Which video platforms do you support?",
    answer: "We support major platforms including YouTube, Instagram, Facebook, X (Twitter), TikTok, Vimeo, and many more. If you can watch it online, we likely support it.",
  },
  {
    question: "Can I download videos in 4K?",
    answer: "Absolutely! If the source video is available in 4K, our system will provide the option to download it in that resolution.",
  },
  {
    question: "Do I need to install any software?",
    answer: "No, our tool is entirely web-based. You don't need to install any software or browser extensions to use it.",
  },
  {
    question: "Is it legal to download videos?",
    answer: "You should only download videos for personal use and when allowed by the creator or the platform's terms of service. We do not encourage copyright infringement.",
  },
];

export default function FAQAccordion() {
  return (
    <section id="faq" className="bg-background/95 py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Everything you need to know about our service.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-background px-6 rounded-2xl border mb-4">
              <AccordionTrigger className="hover:no-underline font-semibold py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
