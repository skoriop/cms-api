import mongoose from "mongoose";

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
	createdAt: {
		type: Date,
		default: Date.now,
		immutable: true,
	},
});

// export const Post = mongoose.model("Post", postSchema);
