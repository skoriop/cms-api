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
	users: {
		type: Array<mongoose.Types.ObjectId>,
		default: [],
	},
	contents: {
		type: Array<typeof Announcement>,
		default: [],
	},
});

export const Course = mongoose.model("Course", courseSchema);
