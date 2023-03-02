import mongoose from "mongoose";

export const commentSchema = new mongoose.Schema({
	by: {
		type: mongoose.Types.ObjectId,
		required: true,
		immutable: true,
	},
	body: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		immutable: true,
	},
});
