import { Router } from "express";
import bcrypt from "bcryptjs";
import createError from "http-errors";

import { User } from "../models/User";

import { UserType } from "../helpers/common";
import {
	signAccessToken,
	signRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
} from "../helpers/jwt";

export const authRoute = Router();

authRoute.post("/register", async (req, res) => {
	const emailExists = await User.findOne({ email: req.body.email });
	if (emailExists) return res.status(400).send("Email already exists");

	const usernameExists = await User.findOne({ username: req.body.username });
	if (usernameExists) return res.status(400).send("Username already exists");

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);
	let type = UserType.STUDENT;

	if (req.headers["authorization"]) {
		const token = req.headers["authorization"].split(" ")[1];
		if (token === process.env.ADMIN_SECRET_TOKEN) {
			if (req.body.type === "admin") type = UserType.ADMIN;
			else if (req.body.type === "professor") type = UserType.PROFESSOR;
			else type = UserType.STUDENT;
		}
	}

	const user = new User({
		email: req.body.email,
		name: req.body.name,
		username: req.body.username,
		password: hashedPassword,
		userType: type,
	});

	try {
		await user.save();
		res.send({ user });
	} catch (err) {
		res.status(400).send(err);
	}
});

authRoute.post("/login", async (req, res) => {
	const by_email = await User.findOne({ email: req.body.email });
	const by_username = await User.findOne({ username: req.body.username });
	if (!by_email && !by_username)
		return res.status(400).send("Wrong credentials");

	const user = by_email || by_username;
	const pass = await bcrypt.compare(req.body.password, user.password);
	if (!pass) return res.status(400).send("Wrong credentials");

	const accessToken = await signAccessToken(user.id);
	const refreshToken = await signRefreshToken(user.id);
	res.send({ user, accessToken, refreshToken });
});

authRoute.post("/refresh-token", async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) throw createError.BadRequest();

		const userId = await verifyRefreshToken(refreshToken);
		const accessToken = await signAccessToken(userId);

		res.send({ accessToken });
	} catch (err) {
		next(err);
	}
});

authRoute.post("/logout", verifyAccessToken, async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) throw createError.BadRequest();

		try {
			const userId = await verifyRefreshToken(refreshToken);
			console.log(`Logged out user with userID: ${userId}`);
			res.sendStatus(204);
		} catch (err) {
			console.log("Unauthorized");
			res.sendStatus(401);
		}
	} catch (err) {
		next(err);
	}
});
