import mongoose from "mongoose";

export const postSchema = new mongoose.Schema({
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

// export const Post = mongoose.model("Post", postSchema);
