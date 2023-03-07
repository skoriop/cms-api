import mongoose from "mongoose";

import { UserType } from "../helpers/common";

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
	},
	name: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		enum: ["Pending", "Active"],
		default: "Pending",
	},
	confirmationCode: {
		type: String,
		unique: true,
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
		immutable: true,
	},
	courses: {
		type: Array<mongoose.Types.ObjectId>,
		default: [],
	},
});

export const User = mongoose.model("User", userSchema);
