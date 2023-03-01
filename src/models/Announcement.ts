import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	body: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export const Announcement = mongoose.model("Course", announcementSchema);
