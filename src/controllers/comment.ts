import { Router } from "express";
import { getCurrentUser, UserType } from "../helpers/common";
import { verifyAccessToken } from "../helpers/jwt";
import { redisClient } from "../helpers/redis_config";
import { Course } from "../models/Course";

export const commentRoute = Router({ mergeParams: true });

commentRoute.post("/create/", verifyAccessToken, async (req: any, res) => {
	let course;

	try {
		course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");
	} catch (err) {
		return res.status(404).send("Course not found");
	}

	const currentUser = await getCurrentUser(req);
	if (currentUser.courses.indexOf(req.params.courseId) === -1)
		return res.status(403).send("User not enrolled");

	const post = course.posts.id(req.params.postId);
	if (!post) return res.status(404).send("Post not found");

	const comment = {
		by: currentUser.id,
		body: req.body.body,
	};

	try {
		post.comments.push(comment);

		await redisClient.set(
			"C-" + req.params.courseId,
			JSON.stringify(course),
			{ XX: true }
		);

		await course.save();
		return res.send(comment);
	} catch (err) {
		return res.status(400).send(err);
	}
});

commentRoute.get("/:commentId/", verifyAccessToken, async (req: any, res) => {
	let course;

	try {
		course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");
	} catch (err) {
		return res.status(404).send("Course not found");
	}

	const currentUser = await getCurrentUser(req);
	if (currentUser.courses.indexOf(req.params.courseId) === -1)
		return res.status(403).send("User not enrolled");

	const post = course.posts.id(req.params.postId);
	if (!post) return res.status(404).send("Post not found");

	const comment = post.comments.id(req.params.commentId);
	if (!comment) return res.status(404).send("Comment not found");

	return res.send(comment);
});

commentRoute.put("/:commentId/", verifyAccessToken, async (req: any, res) => {
	let course;

	try {
		course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");
	} catch (err) {
		return res.status(404).send("Course not found");
	}

	const post = course.posts.id(req.params.postId);
	if (!post) return res.status(404).send("Post not found");

	const comment = post.comments.id(req.params.commentId);
	if (!comment) return res.status(404).send("Comment not found");

	const currentUser = await getCurrentUser(req);
	if (currentUser.courses.indexOf(req.params.courseId) === -1)
		return res.status(403).send("User not enrolled");
	if (currentUser.id !== String(comment.by)) return res.sendStatus(403);

	try {
		comment.set(req.body);

		await redisClient.set(
			"C-" + req.params.courseId,
			JSON.stringify(course),
			{ XX: true }
		);

		await course.save();
		return res.send(comment);
	} catch (err) {
		return res.status(400).send(err);
	}
});

commentRoute.delete(
	"/:commentId/",
	verifyAccessToken,
	async (req: any, res) => {
		let course;

		try {
			course = await Course.findById(req.params.courseId);
			if (!course) return res.status(404).send("Course not found");
		} catch (err) {
			return res.status(404).send("Course not found");
		}

		const post = course.posts.id(req.params.postId);
		if (!post) return res.status(404).send("Post not found");

		const comment = post.comments.id(req.params.commentId);
		if (!comment) return res.status(404).send("Comment not found");

		const currentUser = await getCurrentUser(req);
		if (currentUser.courses.indexOf(req.params.courseId) === -1)
			return res.status(403).send("User not enrolled");
		if (
			currentUser.type === UserType.STUDENT &&
			currentUser.id !== String(comment.by)
		)
			return res.sendStatus(403);

		try {
			comment.remove();
			await course.save();

			await redisClient.set(
				"C-" + req.params.courseId,
				JSON.stringify(course),
				{ XX: true }
			);

			console.log(
				`Deleted comment ${req.params.commentId} on post ${req.params.postId} from course ${req.params.courseId}`
			);
			return res.sendStatus(204);
		} catch (err) {
			return res.status(400).send(err);
		}
	}
);
