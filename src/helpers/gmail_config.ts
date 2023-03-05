import nodemailer from "nodemailer";

export const gmailTransport = nodemailer.createTransport({
	service: "gmail",
	auth: {
		type: "OAuth2",
		user: process.env.GOOGLE_EMAIL_ADDRESS,
		pass: process.env.GOOGLE_EMAIL_PASSWORD,
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
	},
});

console.log("Connected to Gmail!");
