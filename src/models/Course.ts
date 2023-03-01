import mongoose from "mongoose";

import { postSchema } from "./Post";

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
	posts: {
		type: [postSchema],
		default: [],
	},
});

export const Course = mongoose.model("Course", courseSchema);
