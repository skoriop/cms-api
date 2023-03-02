import mongoose from "mongoose";

import { UserType } from "../helpers/common";

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		immutable: true,
	},
	type: {
		type: String,
		enum: UserType,
		required: true,
	},
	courses: {
		type: Array<mongoose.Types.ObjectId>,
		default: [],
	},
});

export const User = mongoose.model("User", userSchema);
