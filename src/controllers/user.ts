import { Router } from "express";
import bcrypt from "bcryptjs";

import { getCurrentUser, UserType } from "../helpers/common";
import { verifyAccessToken } from "../helpers/jwt";

import { User } from "../models/User";

export const userRoute = Router();

userRoute.get("/me", verifyAccessToken, async (req: any, res) => {
	const user = await getCurrentUser(req);
	if (user.userType === UserType.ADMIN) {
		res.send({
			id: user.id,
			username: user.username,
			name: user.name,
			email: user.email,
			type: user.userType,
			courses: user.courses,
		});
	} else {
		res.send({
			username: user.username,
			name: user.name,
			email: user.email,
			type: user.userType,
			courses: user.courses,
		});
	}
});

userRoute.put("/me", verifyAccessToken, async (req: any, res) => {
	const user = await getCurrentUser(req);

	const is_username = await User.findOne({ username: req.body.username });
	if (is_username) return res.status(400).send("Username already exists");

	const is_email = await User.findOne({ email: req.body.email });
	if (is_email) return res.status(400).send("Email already exists");

	let hashedPassword = undefined;
	if (req.body.password !== undefined) {
		const salt = await bcrypt.genSalt(10);
		hashedPassword = await bcrypt.hash(req.body.password, salt);
	}

	try {
		const updatedUser = await User.findOneAndUpdate(
			{ username: user.username },
			{
				username: req.body.username || user.username,
				email: req.body.email || user.email,
				name: req.body.name || user.name,
				password: hashedPassword || user.password,
			},
			{ new: true }
		);
		res.send({
			username: updatedUser.username,
			name: updatedUser.name,
			email: updatedUser.email,
			type: updatedUser.userType,
			courses: updatedUser.courses,
		});
	} catch (err) {
		return res.status(400).send(err);
	}
});

userRoute.delete("/me", verifyAccessToken, async (req: any, res) => {
	const user = await getCurrentUser(req);
	await user.delete();
	console.log(`Deleted user ${user.username}`);
	return res.sendStatus(204);
});

userRoute.get("/:username", verifyAccessToken, async (req: any, res) => {
	const user = await User.findOne({ username: req.params.username });
	if (!user) return res.status(404).send("User not found");

	const currentUser = await getCurrentUser(req);
	if (currentUser.userType === UserType.ADMIN) {
		res.send({
			id: user.id,
			username: user.username,
			name: user.name,
			email: user.email,
			type: user.userType,
			courses: user.courses,
		});
	} else {
		res.send({
			username: user.username,
			name: user.name,
			type: user.userType,
			courses: user.courses,
		});
	}
});

userRoute.put("/:username", verifyAccessToken, async (req: any, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.userType !== UserType.ADMIN) return res.sendStatus(403);

	const user = await User.findOne({ username: req.params.username });
	if (!user) return res.status(404).send("User not found");

	const is_username = await User.findOne({ username: req.body.username });
	if (is_username) return res.status(400).send("Username already exists");

	const is_email = await User.findOne({ email: req.body.email });
	if (is_email) return res.status(400).send("Email already exists");

	const newUser = await User.findOneAndUpdate(
		{ username: req.params.username },
		{
			username: req.body.username || user.username,
			email: req.body.email || user.email,
			name: req.body.name || user.name,
			userType: req.body.type || user.userType,
			courses: req.body.courses || user.courses,
		},
		{ new: true }
	);

	res.send(newUser);
});

userRoute.delete("/:username", verifyAccessToken, async (req: any, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.userType !== UserType.ADMIN) return res.sendStatus(403);

	const user = await User.findOneAndDelete({ username: req.params.username });
	if (!user) return res.status(404).send("User not found");

	console.log(`Deleted user ${req.params.username}`);
	res.sendStatus(204);
});
