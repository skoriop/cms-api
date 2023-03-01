import { Router } from "express";
import { getCurrentUser, UserType } from "../helpers/common";
import { verifyAccessToken } from "../helpers/jwt";
import { Course } from "../models/Course";
import { User } from "../models/User";

export const courseRoute = Router();

courseRoute.post("/create/", verifyAccessToken, async (req, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.userType !== UserType.PROFESSOR) return res.sendStatus(403);

	const course = new Course({
		code: req.body.code,
		name: req.body.name,
	});

	try {
		await course.save();
		res.send({ course });
	} catch (err) {
		res.status(400).send(err);
	}
});

courseRoute.get("/:courseId/", verifyAccessToken, async (req: any, res) => {
	try {
		const course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");

		res.send({ course });
	} catch (err) {
		return res.status(404).send("Course not found");
	}
});

courseRoute.put("/:courseId/", verifyAccessToken, async (req: any, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.userType !== UserType.PROFESSOR) return res.sendStatus(403);

	try {
		const course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");

		const updatedCourse = await Course.findByIdAndUpdate(
			req.params.courseId,
			{
				code: req.body.code || course.code,
				name: req.body.name || course.name,
			},
			{ new: true }
		);
		res.send({ updatedCourse });
	} catch (err) {
		return res.status(404).send("Course not found");
	}
});

courseRoute.delete("/:courseId/", verifyAccessToken, async (req: any, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.userType !== UserType.PROFESSOR) return res.sendStatus(403);

	try {
		const course = await Course.findByIdAndDelete(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");

		console.log(`Deleted course ${req.params.courseId}`);
		res.sendStatus(204);
	} catch (err) {
		return res.status(404).send("Course not found");
	}
});

courseRoute.post("/:courseId/enroll", verifyAccessToken, async (req, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.userType !== UserType.PROFESSOR) return res.sendStatus(403);

	let course;
	try {
		course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");
	} catch (err) {
		return res.status(404).send("Course not found");
	}

	try {
		const user = await User.findById(req.body.userId);
		if (!user) return res.status(400).send("User not found");
	} catch (err) {
		return res.status(400).send("User not found");
	}

	try {
		if (course.users.indexOf(req.body.userId) === -1)
			course.users.push(req.body.userId);

		await course.save();
		res.send({ course });
	} catch (err) {
		res.status(400).send(err);
	}
});

courseRoute.post("/:courseId/unenroll", verifyAccessToken, async (req, res) => {
	const currentUser = await getCurrentUser(req);
	if (currentUser.userType !== UserType.PROFESSOR) return res.sendStatus(403);

	let course;
	try {
		course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");
	} catch (err) {
		return res.status(404).send("Course not found");
	}

	try {
		const user = await User.findById(req.body.userId);
		if (!user) return res.status(400).send("User not found");
	} catch (err) {
		return res.status(400).send("User not found");
	}

	try {
		if (course.users.indexOf(req.body.userId) === -1)
			res.status(400).send("User not enrolled");

		course.users = course.users.filter((e) => e !== req.body.userId);

		await course.save();
		res.send({ course });
	} catch (err) {
		res.status(400).send(err);
	}
});
