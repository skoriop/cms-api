import mongoose from "mongoose";

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
	},
	userType: {
		type: UserType,
		required: true,
	},
	courses: {
		type: Array<mongoose.Types.ObjectId>,
		default: [],
	},
});

export const User = mongoose.model("User", userSchema);
