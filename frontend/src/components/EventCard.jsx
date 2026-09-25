function EventCard({ title, description, date }) {
    return (
        <div>
            <h3>{title}</h3>
            <p>{description}</p>
            <p>{date}</p>
        </div>
    );
}

export default EventCard;