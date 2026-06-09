import Event from "../models/Event.js";

export const getEvents = async (req, res) => {
  try {
    const { year, month } = req.query;

    // Check for year and month (userId is no longer required in query parameters)
    if (!year || !month) {
      return res
        .status(400)
        .json({ error: "Missing year or month parameters." });
    }

    const targetPrefix = `${year}-${String(month).padStart(2, "0")}`;

    // Filter by BOTH the middleware-provided user ID and the date prefix
    const rawEvents = await Event.find({
      user: req.user.id,
      date: { $regex: `^${targetPrefix}` },
    }).lean();

    const structuredEvents = rawEvents.map(({ _id, __v, user, ...rest }) => ({
      id: _id.toString(),
      userId: user.toString(),
      ...rest,
    }));

    return res.status(200).json(structuredEvents);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user events." });
  }
};

export const newEvent = async (req, res) => {
  try {
    const { title, date, isAllDay, startTime, endTime, color } = req.body;

    const newEvent = new Event({
      user: req.user.id, // Linked securely from middleware
      title,
      date,
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      color,
    });

    const savedEvent = await newEvent.save();

    const { _id, __v, user, ...rest } = savedEvent.toObject();
    const structuredEvent = {
      id: _id.toString(),
      userId: user.toString(),
      ...rest,
    };

    return res.status(201).json(structuredEvent);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Look up the event first to ensure resource ownership integrity
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Security check: Verify the logged-in user owns this event record
    if (event.user.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this resource." });
    }

    await event.deleteOne();

    return res.status(200).json({ success: true, message: "Event deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Deletion workflow failed." });
  }
};
