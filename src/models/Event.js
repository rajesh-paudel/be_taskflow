import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true,
    },
    isAllDay: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String, // "HH:MM"
      required: function () {
        return !this.isAllDay;
      },
    },
    endTime: {
      type: String, // "HH:MM"
      required: function () {
        return !this.isAllDay;
      },
    },
    color: {
      type: String,
      default: "bg-[#5A24CA] text-white",
    },
  },
  {
    timestamps: true,
  },
);

const Event = mongoose.model("Event", EventSchema);
export default Event;
