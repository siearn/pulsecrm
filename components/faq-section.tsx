"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqSection() {
  const faqs = [
    {
      question: "How long is the free trial?",
      answer: "We offer a 14-day free trial on all plans. No credit card is required to start your trial.",
    },
    {
      question: "Can I change plans later?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate will apply at the start of your next billing cycle.",
    },
    {
      question: "How does the user-based pricing work?",
      answer:
        "Our pricing is based on the number of users who have access to your PulseCRM account. You can add or remove users at any time, and your billing will adjust accordingly.",
    },
    {
      question: "Is there a limit to how many contacts I can have?",
      answer:
        "Each plan has different limits for contacts. The Starter plan includes 1,000 contacts, Pro includes 10,000 contacts, and Enterprise has unlimited contacts.",
    },
    {
      question: "Can I import my existing data?",
      answer:
        "Yes, PulseCRM makes it easy to import your existing contacts and deals from CSV files or directly from other popular CRM platforms.",
    },
    {
      question: "Do you offer any discounts?",
      answer:
        "We offer a 15% discount for annual billing on all plans. We also have special pricing for non-profit organizations and startups. Contact our sales team for more information.",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Frequently Asked Questions</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Find answers to common questions about PulseCRM
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Still have questions?{" "}
            <a href="/contact" className="text-primary font-medium hover:underline">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

