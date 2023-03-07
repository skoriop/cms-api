import { Router } from "express";
import { deleteObject, ref } from "firebase/storage";
import { getCurrentUser, UserType } from "../helpers/common";
import { storage } from "../helpers/firebase_config";
import {
	sendCourseUpdateEmail,
	sendEnrolledEmail,
	sendUnenrolledEmail,
} from "../helpers/gmail_config";
import { verifyAccessToken } from "../helpers/jwt";
import { redisClient } from "../helpers/redis_config";
import {
	courseSchema,
	updateCourseSchema,
	validate,
} from "../helpers/validation";
import { Course } from "../models/Course";
import { User } from "../models/User";
import { postRoute } from "./post";

export const courseRoute = Router();

courseRoute.post(
	"/create/",
	verifyAccessToken,
	validate(courseSchema),
	async (req, res) => {
		const currentUser = await getCurrentUser(req);
		if (currentUser.type !== UserType.PROFESSOR) return res.sendStatus(403);

		const course = new Course({
			code: req.body.code,
			name: req.body.name,
			users: [currentUser.id],
		});

		try {
			currentUser.courses.push(course.id);
			await currentUser.save();
			await course.save();
			return res.send(course);
		} catch (err) {
			return res.status(400).send(err);
		}
	}
);

courseRoute.get("/:courseId/", verifyAccessToken, async (req: any, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.courses.indexOf(req.params.courseId) === -1)
		return res.status(403).send("User not enrolled");

	try {
		const cachedCourse = await redisClient.get("C-" + req.params.courseId);

		if (cachedCourse) {
			return res.send(JSON.parse(cachedCourse));
		} else {
			try {
				const course = await Course.findById(req.params.courseId);
				if (!course) return res.status(404).send("Course not found");

				await redisClient.set(
					"C-" + req.params.courseId,
					JSON.stringify(course)
				);

				return res.send(course);
			} catch (e) {
				return res.status(404).send("Course not found");
			}
		}
	} catch (err) {
		console.log(err);
		return res.status(500).send(err);
	}
});

courseRoute.put(
	"/:courseId/",
	verifyAccessToken,
	validate(updateCourseSchema),
	async (req: any, res) => {
		const currentUser = await getCurrentUser(req);
		if (currentUser.type !== UserType.PROFESSOR) return res.sendStatus(403);

		try {
			let course;

			try {
				course = await Course.findById(req.params.courseId);
				if (!course) return res.status(404).send("Course not found");
			} catch (e) {
				return res.status(404).send("Course not found");
			}

			const currentUser = await getCurrentUser(req);
			if (currentUser.courses.indexOf(req.params.courseId) === -1)
				return res.status(403).send("User not enrolled");

			const updatedCourse = await Course.findByIdAndUpdate(
				req.params.courseId,
				{
					code: req.body.code || course.code,
					name: req.body.name || course.name,
				},
				{ new: true }
			);

			await redisClient.set(
				"C-" + req.params.courseId,
				JSON.stringify(course),
				{ XX: true }
			);

			try {
				const err = await sendCourseUpdateEmail(updatedCourse);
				if (err) throw err;
			} catch (e) {
				return res.status(500).send(e);
			}

			return res.send(updatedCourse);
		} catch (err) {
			console.log(err);
			return res.status(500).send(err);
		}
	}
);

courseRoute.delete("/:courseId/", verifyAccessToken, async (req: any, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.type !== UserType.PROFESSOR) return res.sendStatus(403);

	try {
		const course = await Course.findByIdAndDelete(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");

		const currentUser = await getCurrentUser(req);
		if (currentUser.courses.indexOf(req.params.courseId) === -1)
			return res.status(403).send("User not enrolled");

		for (const userId of course.users) {
			const user = await User.findById(userId);
			if (!user) continue;

			user.courses = user.courses.filter(
				(e) => e !== req.params.courseId
			);
			await user.save();
		}

		try {
			for (const post of course.posts) {
				for (const fileURL of post.files) {
					const fileRef = ref(storage, fileURL);
					deleteObject(fileRef)
						.then(() => console.log("Deleted " + fileURL))
						.catch((err) => {
							console.log(err.message);
							return res.status(500).send(err);
						});
				}
			}
			await redisClient.del("C-" + course.id);
		} catch (err) {
			console.log(err.message);
			return res.status(500).send(err);
		}

		console.log(`Deleted course ${req.params.courseId}`);
		res.sendStatus(204);
	} catch (err) {
		return res.status(404).send("Course not found");
	}
});

courseRoute.post(
	"/:courseId/enroll/:userId",
	verifyAccessToken,
	async (req, res) => {
		const currentUser = await getCurrentUser(req);
		if (currentUser.type !== UserType.PROFESSOR) return res.sendStatus(403);
		if (currentUser.courses.indexOf(req.params.courseId) === -1)
			return res.status(403).send("User not enrolled");

		let course, user;
		try {
			course = await Course.findById(req.params.courseId);
			if (!course) return res.status(404).send("Course not found");
		} catch (err) {
			return res.status(404).send("Course not found");
		}

		try {
			user = await User.findById(req.params.userId);
			if (!user) return res.status(400).send("User not found");
		} catch (err) {
			return res.status(400).send("User not found");
		}

		try {
			if (course.users.indexOf(req.params.userId) === -1)
				course.users.push(req.params.userId);

			if (user.courses.indexOf(req.params.courseId) === -1)
				user.courses.push(req.params.courseId);

			await user.save();
			await course.save();

			await redisClient.set(
				"C-" + req.params.courseId,
				JSON.stringify(course),
				{ XX: true }
			);

			try {
				const err = await sendEnrolledEmail(user, course);
				if (err) throw err;
			} catch (e) {
				return res.status(500).send(e);
			}

			return res.send(course);
		} catch (err) {
			return res.status(400).send(err);
		}
	}
);

courseRoute.post(
	"/:courseId/unenroll/:userId",
	verifyAccessToken,
	async (req, res) => {
		const currentUser = await getCurrentUser(req);
		if (currentUser.type !== UserType.PROFESSOR) return res.sendStatus(403);
		if (currentUser.courses.indexOf(req.params.courseId) === -1)
			return res.status(403).send("User not enrolled");

		let course, user;
		try {
			course = await Course.findById(req.params.courseId);
			if (!course) return res.status(404).send("Course not found");
		} catch (err) {
			return res.status(404).send("Course not found");
		}

		try {
			user = await User.findById(req.params.userId);
			if (!user) return res.status(400).send("User not found");
		} catch (err) {
			return res.status(400).send("User not found");
		}

		try {
			if (course.users.indexOf(req.params.userId) === -1)
				return res.status(400).send("User not enrolled");

			course.users = course.users.filter((e) => e !== user.id);
			user.courses = user.courses.filter((e) => e !== course.id);

			await user.save();
			await course.save();

			await redisClient.set(
				"C-" + req.params.courseId,
				JSON.stringify(course),
				{ XX: true }
			);

			try {
				const err = await sendUnenrolledEmail(user, course);
				if (err) throw err;
			} catch (e) {
				return res.status(500).send(e);
			}

			return res.send(course);
		} catch (err) {
			return res.status(400).send(err);
		}
	}
);

courseRoute.use("/:courseId/post", postRoute);
