function EventCard({ title, description, date, category, location }) {
    return (
        <div className="event-card">
            <h3>{title}</h3>
            <p>{category}</p>
            <p>{date}</p>
            <p>{location}</p>
            <p>{description}</p>

            <button>View Details</button>
        </div>
    );
}

export default EventCard;