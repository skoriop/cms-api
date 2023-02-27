import { Router } from "express";
import bcrypt from "bcryptjs";

import { User } from "../models/User";

import { UserType } from "../helpers/common";

export const authRoute = Router();

authRoute.post("/register", async (req, res) => {
	const emailExists = await User.findOne({ email: req.body.email });
	if (emailExists) return res.status(400).send("Email already exists");

	// console.log(req.body);
	const salt = await bcrypt.genSalt(10);
	// console.log(salt);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	const user = new User({
		email: req.body.email,
		name: req.body.name,
		username: req.body.username,
		password: hashedPassword,
		userType: UserType.STUDENT,
	});

	try {
		const savedUser = await user.save();
		res.send({ user });
	} catch (err) {
		res.status(400).send(err);
	}
});

authRoute.post("/login", async (req, res) => {
	const user = await User.findOne({ email: req.body.email });
	if (!user) return res.status(400).send("Wrong credentials");

	const pass = await bcrypt.compare(req.body.password, user.password);
	if (!pass) return res.status(400).send("Wrong credentials");

	// TODO: add JWT magic

	res.send({ user, token: "SUCCESS123456" });
});
