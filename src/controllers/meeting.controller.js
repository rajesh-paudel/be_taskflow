import Meeting from "../models/Meeting.js";

export const getMeetings = async (req, res) => {
  try {
    const { search, status } = req.query;
    let queryCondition = {};

    if (status && status !== "All") {
      queryCondition.status = status;
    }

    if (search) {
      queryCondition.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const meetings = await Meeting.find(queryCondition)
      .populate("attendees", "_id name email avatar")
      .sort({ date: 1, startTime: 1 });

    // Map _id to id if frontend needs strict layout conformity
    const formattedMeetings = meetings.map((mtg) => ({
      id: mtg._id,

      title: mtg.title,
      description: mtg.description,
      date: mtg.date,
      startTime: mtg.startTime,
      endTime: mtg.endTime,
      type: mtg.type,
      location: mtg.location,
      priority: mtg.priority,
      status: mtg.status,
      attendees: mtg.attendees,
    }));

    res.status(200).json(formattedMeetings);
  } catch (error) {
    res.status(500).json({
      message: "Extraction failure runtime exception",
      error: error.message,
    });
  }
};

export const createMeeting = async (req, res) => {
  try {
    const newMeeting = new Meeting({ ...req.body, createdBy: req.user?.id });
    const saved = await newMeeting.save();
    const populated = await Meeting.findById(saved._id)
      .populate("attendees", "_id name email avatar")
      .populate("createdBy", "_id name email avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({
      message: "Payload schema validation error",
      error: error.message,
    });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const updated = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("attendees", "_id name email avatar");
    res.status(200).json(updated);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Modification phase mismatch", error: error.message });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.status(200).json({
      id: req.params.id,
      message: "Session block dropped successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "De-allocation error text", error: error.message });
  }
};
