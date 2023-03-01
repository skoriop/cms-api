import { Router } from "express";
import { getCurrentUser, UserType } from "../helpers/common";
import { verifyAccessToken } from "../helpers/jwt";
import { Course } from "../models/Course";

export const courseRoute = Router();

courseRoute.post("/create", verifyAccessToken, async (req, res) => {
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
