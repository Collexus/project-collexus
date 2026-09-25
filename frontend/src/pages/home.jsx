import EventCard from "../components/EventCard";
function Home() {
    return (
        <main>
            <section>
                <h1>Welcome to Collaxus</h1>
                <p>
                    Discover college events, participate in activities,
                    and stay connected with your campus.
                </p>

                <button>Explore Events</button>
            </section>

            <section>
                <h2>Featured Events</h2>

                <div>
                    <EventCard
                        title="Tech Fest"
                        description="Explore technology and innovation."
                    />

                    <EventCard
                        title="Cultural Fest"
                        description="Celebrate talent, culture, and creativity."
                    />

                    <EventCard
                        title="Sports Meet"
                        description="Participate in exciting sports activities."
                    />
                </div>
            </section>
        </main>
    );
}

export default Home;