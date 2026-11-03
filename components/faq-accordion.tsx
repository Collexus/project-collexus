"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const questions = [
  {
    question: "Where do event dates and details come from?",
    answer:
      "Listings are drawn from published RCEE event information and linked source pages. Open an event and check its source link for the organizer’s latest details, especially when a date or fee may have changed.",
  },
  {
    question: "Does a pass preview register me for an event?",
    answer:
      "No. Pass and registration previews on Collexus are local demos. They do not submit a registration, reserve a place, take payment, or grant entry. Use the event’s official registration link when one is provided.",
  },
  {
    question: "Can I bring friends or guests to a fest?",
    answer:
      "Guest eligibility depends on the fest and its organizer’s rules. Check the specific event listing and confirm with the organizer before inviting outside guests.",
  },
  {
    question: "How can I confirm the fee or whether registration is open?",
    answer:
      "Check the event page and its official source link. Collexus shows published fee and registration information when available; a missing amount or a closed listing means you should confirm directly with the organizer.",
  },
  {
    question: "How do I ask a question or report incorrect event information?",
    answer:
      "Contact the Collexus team at hello@collexus.in and include the event name and the detail that needs attention. For urgent registration or entry questions, contact the event organizer as well.",
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
