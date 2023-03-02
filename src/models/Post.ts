import mongoose from "mongoose";

import { commentSchema } from "./Comment";

export const postSchema = new mongoose.Schema({
	by: {
		type: mongoose.Types.ObjectId,
		required: true,
		immutable: true,
	},
	title: {
		type: String,
		required: true,
	},
	body: {
		type: String,
		required: true,
	},
	files: {
		type: Array<String>,
		default: [],
	},
	comments: {
		type: [commentSchema],
		default: [],
	},
	createdAt: {
		type: Date,
		default: Date.now,
		immutable: true,
	},
});
