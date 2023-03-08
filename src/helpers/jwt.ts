import jwt from "jsonwebtoken";
import createError from "http-errors";
import { getCurrentUser } from "./common";

export const signAccessToken = (userId) => {
	return new Promise((resolve, reject) => {
		const payload = {};
		const secret = process.env.ACCESS_SECRET_TOKEN;
		const options = {
			expiresIn: "1h",
			issuer: "skoriop-cms.com",
			audience: userId,
		};
		jwt.sign(payload, secret, options, (err, token) => {
			if (err) {
				console.log(err.message);
				return reject(createError.InternalServerError());
			}
			resolve(token);
		});
	});
};

export const verifyAccessToken = (req, res, next) => {
	if (!req.headers["authorization"]) return res.sendStatus(401);
	const token = req.headers["authorization"].split(" ")[1];
	jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, payload) => {
		if (err) return res.status(401).send(err);
		if (payload.iss !== "skoriop-cms.com")
			return res.status(401).send("Wrong JWT issuer");
		req.payload = payload;
		getCurrentUser(req).then((user) => {
			if (user.status !== "Active")
				return res.status(401).send("Account not verified");
			else next();
		});
	});
};

export const signRefreshToken = (userId) => {
	return new Promise((resolve, reject) => {
		const payload = {};
		const secret = process.env.REFRESH_SECRET_TOKEN;
		const options = {
			expiresIn: "7d",
			issuer: "skoriop-cms.com",
			audience: userId,
		};
		jwt.sign(payload, secret, options, (err, token) => {
			if (err) {
				console.log(err.message);
				return reject(createError.InternalServerError());
			}
			resolve(token);
		});
	});
};

export const verifyRefreshToken = (refreshToken) => {
	return new Promise((resolve, reject) => {
		jwt.verify(
			refreshToken,
			process.env.REFRESH_SECRET_TOKEN,
			(err, payload) => {
				if (err) {
					console.log(err);
					return reject(createError.Unauthorized());
				}
				resolve(payload.aud);
			}
		);
	});
};

export const createConfirmationCode = (email) => {
	return new Promise((resolve, reject) => {
		const payload = { email: email };
		const secret = process.env.CONFIRMATION_CODE_SECRET_TOKEN;
		jwt.sign(payload, secret, (err, token) => {
			if (err) {
				console.log(err.message);
				return reject(createError.InternalServerError());
			}
			resolve(token);
		});
	});
};
