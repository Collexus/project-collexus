"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const questions = [
  {
    question: "What can I search for?",
    answer:
      "Search published RCEE hackathons, workshops, project expos and cultural events. Search by an event title or choose a category suggestion.",
  },
  {
    question: "Can I filter events by category?",
    answer:
      "Yes. Open the filters to narrow the list by category, participation scope, listed fee and department track. Clear filters to restore the full list.",
  },
  {
    question: "Is the interface mobile friendly?",
    answer:
      "Yes. The navigation, event cards, filters and event details adapt to smaller screens.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list" id="faqList">
      {questions.map(({ question, answer }, index) => {
        const isOpen = openIndex === index;
        const answerId = `faq-answer-${index}`;

        return (
          <article className={`faq-item${isOpen ? " open" : ""}`} key={question}>
            <button
              aria-controls={answerId}
              aria-expanded={isOpen}
              className="faq-question"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              type="button"
            >
              <span>{question}</span>
              <ChevronDown aria-hidden="true" className="faq-chevron" size={20} strokeWidth={2.25} />
            </button>
            <p aria-hidden={!isOpen} id={answerId}>
              {answer}
            </p>
          </article>
        );
      })}
    </div>
  );
}
