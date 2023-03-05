import { Router } from "express";
import bcrypt from "bcryptjs";
import { gmailTransport } from "../helpers/gmail_config";
import { UserType } from "../helpers/common";
import {
	createConfirmationCode,
	signAccessToken,
	signRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
} from "../helpers/jwt";
import { User } from "../models/User";

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

	const confirmationCode = await createConfirmationCode(req.body.email);

	const user = new User({
		email: req.body.email,
		name: req.body.name,
		username: req.body.username,
		password: hashedPassword,
		confirmationCode: confirmationCode,
		type: type,
	});

	try {
		await user.save();

		try {
			await gmailTransport.sendMail({
				from: `Skoriop CMS <${process.env.GOOGLE_EMAIL_ADDRESS}>`,
				to: user.email,
				subject: "Skoriop CMS - please confirm your account",
				html: `<div>
							<h2>Hello ${user.name}!</h2>
							<p>Thank you for signing up on Skoriop CMS. Please confirm your email by clicking the following link:</p>
							<a href=http://${process.env.API_DOMAIN_NAME}:${process.env.API_PORT}/auth/confirm/${user.confirmationCode}>Confirm your email</a>
						</div>`,
			});
		} catch (e) {
			return res.status(500).send(e);
		}

		return res.send(user);
	} catch (err) {
		return res.status(400).send(err);
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
	return res.send({ user, accessToken, refreshToken });
});

authRoute.post("/refresh-token", async (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken) return res.sendStatus(400);

	const userId = await verifyRefreshToken(refreshToken);
	const accessToken = await signAccessToken(userId);

	return res.send({ accessToken });
});

authRoute.post("/logout", verifyAccessToken, async (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken) return res.sendStatus(400);

	const userId = await verifyRefreshToken(refreshToken);
	console.log(`Logged out user ${userId}`);
	return res.sendStatus(204);
});

authRoute.get("/confirm/:code", async (req, res) => {
	const user = await User.findOne({ confirmationCode: req.params.code });
	if (!user) return res.status(404).send("User not found");

	if (user.status === "Active")
		return res.status(400).send("User already verified");

	try {
		user.status = "Active";
		await user.save();
		console.log("Verified user " + user.id);
		return res.sendStatus(200);
	} catch (err) {
		return res.status(500).send(err);
	}
});
