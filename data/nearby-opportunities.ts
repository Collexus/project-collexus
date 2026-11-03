export type NearbyOpportunity = {
  category: string;
  title: string;
  date: string;
  fee: string;
  feeType: "free" | "paid" | "mixed" | "check";
  domains: string[];
  venue: string;
  organizer: string;
  highlight: string;
  image: string;
  href: string;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Curated from organizer or host pages on 3 November 2026. Keep the official
// link on every card so visitors can confirm current eligibility and status.
export const nearbyOpportunities: NearbyOpportunity[] = [
  {
    category: "HACKATHON · ANDHRA PRADESH",
    title: "MIND SPRINT 2K26",
    date: "11–12 December 2026 · Registration listed open",
    fee: "Paid · ₹1,200 per 3-person team (listed rate)",
    feeType: "paid",
    domains: ["AI & automation", "IoT", "Robotics", "AgriTech", "FinTech"],
    venue: "PSCMR College of Engineering & Technology, Vijayawada",
    organizer: "PSCMR CET, in association with Brainovision Solutions",
    highlight: "36-hour national hackathon · ₹4 lakh+ prize pool · AI & automation, IoT & robotics. Challenge themes are described as inspired by Microsoft, Google, Infosys and TCS; these are not listed as event sponsors.",
    image: `${basePath}/assets/event-art/hackathon.webp`,
    href: "https://brainovision.in/MindSprint",
  },
  {
    category: "HACKATHON · ANDHRA PRADESH",
    title: "HackWithAditya 2026",
    date: "18–20 December 2026 · Level 1 closes 25 November",
    fee: "Mixed · Level 1 free; shortlisted Level 2 is ₹800 per member",
    feeType: "mixed",
    domains: ["AI", "AgriTech", "HealthTech", "EV & sustainability", "Robotics", "Cybersecurity"],
    venue: "Aditya University, Surampalem, Kakinada district",
    organizer: "Aditya University",
    highlight: "48-hour residential build · ₹5 lakh prize pool · Level 1 prototype screening is free; shortlisted teams pay ₹800 per member. In association with Oracle Academy and in collaboration with OpenAI Student Collective.",
    image: `${basePath}/assets/event-art/hackathon.webp`,
    href: "https://codeforge.adityauniversity.in/",
  },
  {
    category: "STUDENT HACKATHON · ANDHRA PRADESH",
    title: "AVISHKAAR Season 4",
    date: "Applications close 7 November 2026",
    fee: "Check official listing · fee not confirmed here",
    feeType: "check",
    domains: ["Innovation", "Engineering", "Interdisciplinary problem-solving"],
    venue: "Aditya Institute of Technology and Management, Tekkali",
    organizer: "Aditya Institute of Technology and Management (AITAM)",
    highlight: "National innovation challenge for student teams · the organizer’s Unstop listing shows a ₹3 lakh prize pool and a 2–4 member team size. Check the listing for current rounds and eligibility.",
    image: `${basePath}/assets/event-art/expo.webp`,
    href: "https://unstop.com/hackathons/avishkaar-season-4-hackathon-a-national-level-innovation-challenge-aditya-institute-of-technology-and-managem-1750320",
  },
  {
    category: "RUN · TELANGANA",
    title: "IIT Hyderabad Half Marathon 2026",
    date: "22 November 2026",
    fee: "Paid · ₹499–₹999 depending on race category",
    feeType: "paid",
    domains: ["Running", "Endurance", "Fitness", "Sports"],
    venue: "IIT Hyderabad campus, Kandi, Sangareddy",
    organizer: "IIT Hyderabad Runners Club",
    highlight: "21.1K, 10K, 5K timed and 5K fun-run categories, RFID timing and finisher certificates. The official page lists Swan Turbine Services Pvt Ltd as title sponsor.",
    image: `${basePath}/assets/event-art/sports.webp`,
    href: "https://iithydrunnersclub.com/",
  },
  {
    category: "AI & CYBERSECURITY HACKATHON · TELANGANA",
    title: "CipherCop 2026",
    date: "Online screenings: 20 & 25 November · Finals: 30 November–1 December",
    fee: "Check official page · fee not stated",
    feeType: "check",
    domains: ["AI", "Cybersecurity", "Drones", "Geospatial", "Disaster response"],
    venue: "TGICCC Auditorium, Banjara Hills, Hyderabad",
    organizer: "Central Detective Training Institute, Hyderabad",
    highlight: "National hackathon on AI, cybersecurity, drone surveillance and disaster response. Open to students, startups and industry experts; the page cites IIIT and ISB Hyderabad professionals among mentors.",
    image: `${basePath}/assets/event-art/hackathon.webp`,
    href: "https://ciphercop.net/",
  },
  {
    category: "CONFERENCE · TELANGANA",
    title: "Photonics 2026",
    date: "9–13 December 2026 · Final registration closes 30 November",
    fee: "Paid · student rate ₹5,000 after 1 November; categories vary",
    feeType: "paid",
    domains: ["Photonics", "Optics", "Lasers", "Fibre optics", "Research"],
    venue: "IIT Hyderabad, Kandi, Sangareddy",
    organizer: "IIT Hyderabad",
    highlight: "17th International Conference on Fiber Optics and Photonics. The organizer lists collaboration with University of Hyderabad, DRDO CHESS and TIFR Hyderabad, plus 120 sessions and 200 speakers.",
    image: `${basePath}/assets/event-art/workshop.webp`,
    href: "https://photonics2026.iith.ac.in/",
  },
  {
    category: "ENGINEERING CONFERENCE · TELANGANA",
    title: "NMAMLD 2026",
    date: "14–16 December 2026",
    fee: "Check official page · fee not stated in event overview",
    feeType: "check",
    domains: ["Computational mechanics", "Materials", "Fracture modeling", "Civil engineering"],
    venue: "IIT Hyderabad",
    organizer: "Indian Institute of Technology Hyderabad",
    highlight: "International conference on computational mechanics for localized deformation, damage and fracture, with applications to metals, concrete and composites.",
    image: `${basePath}/assets/event-art/expo.webp`,
    href: "https://iith.ac.in/events/2026/12/14/nmamld-2026/",
  },
  {
    category: "PHYSICS SYMPOSIUM · TELANGANA",
    title: "XXVII DAE-BRNS High Energy Physics Symposium",
    date: "16–20 December 2026 · Accommodation requests by 15 November",
    fee: "Paid · PhD student rate ₹4,000 early / ₹5,000 regular; other categories vary",
    feeType: "paid",
    domains: ["High-energy physics", "Particle physics", "Cosmology", "Neutrinos", "Detector systems"],
    venue: "IIT Hyderabad · jointly organized with University of Hyderabad",
    organizer: "IIT Hyderabad and University of Hyderabad under DAE-BRNS",
    highlight: "Biennial national physics symposium with invited plenaries and poster sessions for researchers and doctoral students. The official page provides registration and accommodation details.",
    image: `${basePath}/assets/event-art/workshop.webp`,
    href: "https://physics.iith.ac.in/daehep2026/",
  },
  {
    category: "STRUCTURAL ENGINEERING · TELANGANA",
    title: "SEC-2026 · 15th Structural Engineering Convention",
    date: "20–23 December 2026 · Check the organizer for current registration",
    fee: "Paid · check official page for current category rates",
    feeType: "paid",
    domains: ["Structural engineering", "Civil engineering", "Construction", "Sustainability"],
    venue: "IIT Hyderabad",
    organizer: "IIT Hyderabad under the Indian Association for Structural Engineering",
    highlight: "International convention for students, researchers, practicing engineers and industry stakeholders, focused on safe and sustainable construction. The early-bird deadline has passed.",
    image: `${basePath}/assets/event-art/expo.webp`,
    href: "https://civil.iith.ac.in/SEC2026/",
  },
  {
    category: "SCIENTIFIC PYTHON · TAMIL NADU",
    title: "SciPy India 2026",
    date: "19–20 December 2026 · Check the official site for tickets",
    fee: "Ticketed · see official site for current rates",
    feeType: "paid",
    domains: ["Scientific Python", "Data science", "Research software", "Open source"],
    venue: "Indian Institute of Technology Madras, Chennai",
    organizer: "SciPy India community",
    highlight: "Community conference for scientific Python, open-source projects, research and applied computing. The official announcement confirms the IIT Madras venue and dates.",
    image: `${basePath}/assets/event-art/workshop.webp`,
    href: "https://scipy.in/2026/",
  },
];
