export type EventCategory = "Hackathon" | "Workshop" | "Project expo" | "Cultural" | "Special event";
export type EventBranch = "IoT" | "Hardware" | "Campus" | "AI & Data Science";

export type CampusEvent = {
  slug: string;
  title: string;
  category: EventCategory;
  specialEvent?: boolean;
  branch: EventBranch;
  tracks: string[];
  audience: "Open to all" | "RCEE students" | "External participants";
  dateStart: string | null;
  dateEnd?: string | null;
  dateLabel: string;
  venue: string;
  organizer: string;
  description: string;
  fee: string;
  paymentUrl?: string;
  format: string;
  image: string;
  source: string;
  report?: string;
  highlights: string[];
};

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const events: CampusEvent[] = [
  {
    slug: "prakalp-2026",
    title: "PRAKALP 2026 — Project Expo & 24-Hour Hackathon",
    category: "Hackathon",
    branch: "IoT",
    tracks: ["iot", "cyber security", "ai & data science", "embedded systems", "computer science & it"],
    audience: "External participants",
    dateStart: "2026-04-01",
    dateEnd: "2026-04-02",
    dateLabel: "April 1–2, 2026",
    venue: "Ramachandra College of Engineering, Eluru · multiple venues including the Central Library",
    organizer: "Ramachandra College of Engineering",
    description:
      "PRAKALP 2026 was a two-day national project expo and offline 24-hour hackathon at Ramachandra College of Engineering in Eluru. RCEE described 100+ expo slots across 10 domains and 200+ hackathon teams across four themes: IoT Sprint, Cyber Security, AI Agents Hack and Embed Fusion. The college listed a ₹3,00,000 combined prize pool. The IoT Sprint report records a 10:00 AM April 1 start and 10:00 AM April 2 finish.",
    fee: "The PRAKALP page listed ₹1,000 for a single participant or duo, and ₹500 per person for teams of 3–5. Registration is closed.",
    paymentUrl: "https://rzp.io/rzp/nqlZqLTa",
    format: "In person · 24-hour IoT Sprint plus project expo",
    image: `${publicBasePath}/assets/event-art/hackathon.webp`,
    source: "https://www.rcee.ac.in/prakalp",
    report: "https://www.rcee.ac.in/news/nas-361672321",
    highlights: [
      "The IoT Sprint ran from April 1 at 10:00 AM to April 2 at 10:00 AM.",
      "RCEE listed a ₹3,00,000 combined prize pool, 100+ expo slots and 200+ hackathon teams.",
      "The four hackathon themes were IoT Sprint, Cyber Security, AI Agents Hack and Embed Fusion.",
      "The main page lists hackathon fees of ₹1,000 for one or two participants and ₹500 per person for teams of 3–5. Its FAQ gives a different general team-size range; the linked IoT Sprint report describes teams of 3–4.",
      "The IoT Sprint was organized by CSE (IoT); preparatory Arduino, ESP32 and NodeMCU workshops were held March 24–25.",
    ],
  },
  {
    slug: "nodemcu-esp8266-workshop",
    title: "A 5-Day Hands-On Workshop on NodeMCU ESP8266",
    category: "Workshop",
    branch: "Hardware",
    tracks: ["iot", "electronics & communication"],
    audience: "Open to all",
    dateStart: null,
    dateLabel: "Dates not listed",
    venue: "RCEE · ECE Department",
    organizer: "RCEE Department of ECE",
    description:
      "A five-day practical workshop on IoT and embedded systems using NodeMCU ESP8266. The department report describes sensor interfacing, display integration, motor and PWM control, MQTT communication, Blynk cloud dashboards and a final project demonstration.",
    fee: "Not specified in the official report.",
    format: "Hands-on workshop · five days",
    image: `${publicBasePath}/assets/event-art/workshop.webp`,
    source: "https://www.rcee.ac.in/news/nas-947404574",
    highlights: [
      "Practical sessions used the NodeMCU ESP8266 board.",
      "Topics included sensors, displays, motors, PWM, MQTT and Blynk cloud dashboards.",
      "The official report does not state exact dates or a venue beyond the department context.",
    ],
  },
  {
    slug: "iot-meets-ml-workshop",
    title: "IoT Meets ML — Two-Day Hands-on Workshop",
    category: "Workshop",
    branch: "IoT",
    tracks: ["iot", "ai & data science"],
    audience: "Open to all",
    dateStart: "2026-02-12",
    dateEnd: "2026-02-13",
    dateLabel: "February 12–13, 2026",
    venue: "Not specified in the official report",
    organizer: "CSE (IoT) · RevoIoT",
    description:
      "A two-day workshop exploring how Internet of Things and machine learning can work together in smart applications. The report highlights live demonstrations and hands-on work with development boards and sensors.",
    fee: "Not specified in the official report.",
    format: "In person · two-day hands-on workshop",
    image: `${publicBasePath}/assets/event-art/workshop.webp`,
    source: "https://www.rcee.ac.in/news/nas-681809310",
    highlights: [
      "Conducted February 12–13, 2026.",
      "Included hands-on demonstrations with development boards and sensors.",
      "The report covers data collection, model training and intelligent system design.",
    ],
  },
  {
    slug: "sports-cricket-workshop-2026",
    title: "Sports & Games Men Cricket Workshop ’26",
    category: "Workshop",
    branch: "Campus",
    tracks: ["campus & sports", "physical education"],
    audience: "RCEE students",
    dateStart: "2026-05-04",
    dateEnd: "2026-05-06",
    dateLabel: "May 4–6, 2026",
    venue: "Ramachandra College of Engineering · exact venue not listed",
    organizer: "RCEE Department of Physical Education",
    description:
      "A three-day cricket workshop led by resource persons and professional trainers. RCEE’s report describes practical coaching in batting, bowling and fielding, with sessions focused on fitness, teamwork, leadership and sportsmanship.",
    fee: "Not specified in the official report.",
    format: "Three-day practical sports workshop",
    image: `${publicBasePath}/assets/event-art/sports.webp`,
    source: "https://www.rcee.ac.in/news/nas-698235245",
    highlights: [
      "The official report dates the workshop May 4–6, 2026.",
      "Practical training covered batting, bowling and fielding techniques.",
      "The report mentions fitness, teamwork, leadership and sportsmanship activities.",
      "The report does not give an exact venue or fee.",
    ],
  },
  {
    slug: "agentic-ai-workshop-2026",
    title: "Three-Day Workshop on Agentic AI",
    category: "Workshop",
    branch: "AI & Data Science",
    tracks: ["ai & data science"],
    audience: "RCEE students",
    dateStart: "2026-03-23",
    dateEnd: "2026-03-25",
    dateLabel: "March 23–25, 2026",
    venue: "Ramachandra College of Engineering · exact room not listed",
    organizer: "RCEE Department of Artificial Intelligence and Data Science",
    description:
      "A three-day student workshop introducing Agentic AI, generative AI, large language models and transformer-based systems. RCEE’s report says participants explored agent memory, tools, decision-making, reasoning and workflow automation, then built and presented AI-powered applications.",
    fee: "Not specified in the official report.",
    format: "Three-day hands-on workshop",
    image: `${publicBasePath}/assets/event-art/workshop.webp`,
    source: "https://www.rcee.ac.in/news/nas-208156411",
    highlights: [
      "The report dates the workshop March 23–25, 2026.",
      "Topics included generative AI, LLMs, transformer architectures, agent memory and tool use.",
      "Students built and presented AI-powered applications.",
      "The report does not list a room, fee or public registration details.",
    ],
  },
  {
    slug: "avishkar-pre-hackathon-workshops-2026",
    title: "AVISHKAR Pre-Hackathon Workshops · IoT & Cyber Security",
    category: "Workshop",
    branch: "IoT",
    tracks: ["iot", "cyber security"],
    audience: "RCEE students",
    dateStart: "2026-03-18",
    dateEnd: "2026-03-20",
    dateLabel: "March 18–20, 2026",
    venue: "Ramachandra College of Engineering, Eluru",
    organizer: "AVISHKAR 2026 · Ramachandra College of Engineering",
    description:
      "The official AVISHKAR 2026 event site lists compulsory pre-hackathon workshops for internal participants. The IoT and Cyber Security tracks run March 18–20, ahead of the main project expo and 24-hour hackathon.",
    fee: "Included in the internal hackathon fee, according to the AVISHKAR event site.",
    format: "In person · pre-hackathon workshop tracks",
    image: `${publicBasePath}/assets/event-art/workshop.webp`,
    source: "https://avishkar.rcee.ac.in/",
    highlights: [
      "The AVISHKAR site lists IoT and Cyber Security workshops for March 18–20, 2026.",
      "The site describes the workshops as compulsory for internal hackathon participants.",
      "The public site does not give a room or daily timetable for these tracks.",
    ],
  },
  {
    slug: "avishkar-genai-pre-hackathon-workshop-2026",
    title: "AVISHKAR Pre-Hackathon Workshop · Generative AI",
    category: "Workshop",
    branch: "AI & Data Science",
    tracks: ["ai & data science"],
    audience: "RCEE students",
    dateStart: "2026-03-21",
    dateEnd: "2026-03-23",
    dateLabel: "March 21–23, 2026",
    venue: "Ramachandra College of Engineering, Eluru",
    organizer: "AVISHKAR 2026 · Ramachandra College of Engineering",
    description:
      "The AVISHKAR 2026 event site lists a Generative AI workshop track from March 21–23 as part of its pre-hackathon program for internal participants.",
    fee: "Included in the internal hackathon fee, according to the AVISHKAR event site.",
    format: "In person · pre-hackathon workshop track",
    image: `${publicBasePath}/assets/event-art/workshop.webp`,
    source: "https://avishkar.rcee.ac.in/",
    highlights: [
      "The official AVISHKAR site lists the Generative AI track for March 21–23, 2026.",
      "The pre-hackathon workshops are described as compulsory for internal hackathon participants.",
      "The public site does not give a room or daily timetable for this track.",
    ],
  },
  {
    slug: "generative-ai-workshop-2026",
    title: "Three-Day Workshop on Generative AI",
    category: "Workshop",
    branch: "AI & Data Science",
    tracks: ["ai & data science"],
    audience: "RCEE students",
    dateStart: "2026-03-23",
    dateEnd: "2026-03-25",
    dateLabel: "March 23–25, 2026",
    venue: "Ramachandra College of Engineering · exact room not listed",
    organizer: "RCEE Department of Artificial Intelligence and Data Science",
    description:
      "A three-day student workshop on modern generative AI. RCEE’s report describes transformer architecture, large language models, prompt engineering, structured outputs, model optimization and hands-on application development.",
    fee: "Not specified in the official report.",
    format: "Three-day hands-on workshop",
    image: `${publicBasePath}/assets/event-art/workshop.webp`,
    source: "https://www.rcee.ac.in/news/nas-214646355",
    highlights: [
      "The RCEE report says the workshop ran March 23–25, 2026.",
      "Topics included transformer architecture, LLMs, prompt engineering and structured outputs.",
      "Participants developed generative AI applications in hands-on sessions.",
      "The report does not list a room, fee or public registration details.",
    ],
  },
  {
    slug: "kreya-26-cultural-fest",
    title: "KREYA ’26 — RCE(A) Cultural Fest",
    category: "Cultural",
    specialEvent: true,
    branch: "Campus",
    tracks: ["campus & culture", "arts & media"],
    audience: "Open to all",
    dateStart: null,
    dateLabel: "Dates not listed",
    venue: "Ramachandra College of Engineering, Eluru",
    organizer: "Ramachandra College of Engineering",
    description:
      "The fifth edition of RCEE’s annual cultural fest took place in 2026. The college describes Kreya as a celebration spanning art, music, literature, culture and technical excellence. Its public report does not give the exact fest dates or schedule.",
    fee: "Not specified in the official report.",
    format: "On-campus cultural fest",
    image: `${publicBasePath}/assets/event-art/cultural.webp`,
    source: "https://www.rcee.ac.in/news/nas-628259225",
    highlights: [
      "The college described this as the fifth edition of its annual cultural fest in 2026.",
      "The program spans art, music, literature, culture and technical excellence.",
      "Exact event dates and schedule are not stated in the public report.",
    ],
  },
  {
    slug: "technotsav-2k26-project-expo",
    title: "TECHNOTSAV-2K26 — Innovative Project Expo",
    category: "Project expo",
    branch: "IoT",
    tracks: ["iot", "ai & data science", "software & it", "embedded systems"],
    audience: "Open to all",
    dateStart: null,
    dateLabel: "Dates not listed",
    venue: "Not specified in the official report",
    organizer: "RCEE Department of IoT",
    description:
      "An engineering project expo showcasing student work in artificial intelligence, IoT, robotics, embedded systems and software development. The report describes project demonstrations, evaluation and feedback from faculty, industry experts and visitors.",
    fee: "Not specified in the official report.",
    format: "In-person project expo",
    image: `${publicBasePath}/assets/event-art/expo.webp`,
    source: "https://www.rcee.ac.in/news/nas-665694445",
    highlights: [
      "Student projects included AI, IoT, robotics, embedded systems and software.",
      "Faculty, industry experts and visitors evaluated projects and gave feedback.",
      "The official summary does not specify the expo dates or venue.",
    ],
  },
  {
    slug: "smt-pcb-assembly-workshop",
    title: "Industry Immersion: SMT & PCB Assembly Workshop",
    category: "Workshop",
    branch: "Hardware",
    tracks: ["electronics & communication"],
    audience: "Open to all",
    dateStart: null,
    dateLabel: "Dates not listed",
    venue: "RCEE · ECE Department",
    organizer: "RCEE Department of ECE",
    description:
      "An ECE industry immersion workshop focused on surface-mount technology and printed circuit board assembly. The department’s official event listing identifies it as a hands-on workshop, but the listing summary does not provide session dates or a schedule.",
    fee: "Not specified in the official listing.",
    format: "Hands-on industry immersion workshop",
    image: `${publicBasePath}/assets/event-art/workshop.webp`,
    source: "https://ece.rcee.ac.in/events",
    highlights: [
      "The ECE department lists this as an industry immersion workshop.",
      "The subject is surface-mount technology and printed circuit board assembly.",
      "The listing does not provide exact workshop dates or a session schedule.",
    ],
  },
];

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}
