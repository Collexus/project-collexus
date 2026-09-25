import EventCard from "../components/EventCard";
import "./Home.css";

function Home() {
    const events = [
        {
            title: "Tech Fest",
            category: "CSE",
            date: "15 October 2026",
            location: "CSE Block",
            description: "Explore technology and innovation.",
        },
        {
            title: "Cultural Fest",
            category: "ECE",
            date: "20 October 2026",
            location: "College Auditorium",
            description: "Celebrate talent, culture, and creativity.",
        },
        {
            title: "Sports Meet",
            category: "Sports",
            date: "25 October 2026",
            location: "College Ground",
            description: "Participate in exciting sports activities.",
        },
    ];

    return (
        <main className="home-page">
            <section className="hero-section">
                <h1>Welcome to Collaxus</h1>

                <p>
                    Discover college events, participate in activities,
                    and stay connected with your campus.
                </p>

                <button>Explore Events</button>
            </section>

            <section className="featured-section">
                <h2>Featured Events</h2>

                <div className="event-grid">
                    {events.map((event) => (
                        <EventCard
                            key={event.title}
                            title={event.title}
                            category={event.category}
                            date={event.date}
                            location={event.location}
                            description={event.description}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}

export default Home;