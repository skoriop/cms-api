import mongoose from "mongoose";

import { Announcement } from "./Announcement";

const courseSchema = new mongoose.Schema({
	code: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	users: {
		type: Array<mongoose.Types.ObjectId>,
		default: [],
	},
	announcements: {
		type: Array<typeof Announcement>,
		default: [],
	},
});

export const Course = mongoose.model("Course", courseSchema);
