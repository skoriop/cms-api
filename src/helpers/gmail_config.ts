import nodemailer from "nodemailer";
import "dotenv/config";
import { User } from "../models/User";
import { producer } from "./rabbitmq_config";

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

export const sendEmailNotification = (msg) => {
	producer.sendToQueue("EMAIL_QUEUE", Buffer.from(JSON.stringify(msg)));
};

export const sendVerificationEmail = async (user) => {
	try {
		sendEmailNotification({
			to: user.email,
			subject: `${process.env.GOOGLE_EMAIL_DISPLAY_NAME} - please confirm your account`,
			html: `<div>
				<p>Hello ${user.name}!</p>
				<p>Thank you for signing up on Skoriop CMS. Please confirm your email by clicking the following link:</p>
				<a href=http://${process.env.API_DOMAIN_NAME}:${process.env.API_PORT}/auth/confirm/${user.confirmationCode}>Confirm your email</a>
			</div>`,
		});
		return null;
	} catch (err) {
		console.log(err);
		return err;
	}
};

export const sendEnrolledEmail = async (user, course) => {
	try {
		sendEmailNotification({
			to: user.email,
			subject: `${process.env.GOOGLE_EMAIL_DISPLAY_NAME} - Enrolled in course ${course.name}`,
			html: `<div>
				<p>Hello ${user.name}!</p>
				<p>You have been enrolled in the course <b>${course.name}</b>.</p>
			</div>`,
		});
		return null;
	} catch (err) {
		console.log(err);
		return err;
	}
};

export const sendUnenrolledEmail = async (user, course) => {
	try {
		sendEmailNotification({
			to: user.email,
			subject: `${process.env.GOOGLE_EMAIL_DISPLAY_NAME} - Unenrolled from course ${course.name}`,
			html: `<div>
				<p>Hello ${user.name}!</p>
				<p>You have been unenrolled from the course <b>${course.name}</b>.</p>
			</div>`,
		});
		return null;
	} catch (err) {
		console.log(err);
		return err;
	}
};

export const sendCourseUpdateEmail = async (course) => {
	try {
		let emailIds = [];
		for (const userId of course.users) {
			const user = await User.findById(userId);
			if (!user) continue;
			emailIds.push(user.email);
		}

		sendEmailNotification({
			to: emailIds,
			subject: `${process.env.GOOGLE_EMAIL_DISPLAY_NAME} - ${course.name} was updated`,
			html: `<div>
				<p>Course <b>${course.name}</b> has been recently updated.</p>
			</div>`,
		});
		return null;
	} catch (err) {
		console.log(err);
		return err;
	}
};
