import { Router } from "express";
import {
	deleteObject,
	getDownloadURL,
	ref,
	uploadBytesResumable,
} from "firebase/storage";
import multer from "multer";
import { getCurrentUser, UserType } from "../helpers/common";
import { storage } from "../helpers/firebase_config";
import { verifyAccessToken } from "../helpers/jwt";
import { redisClient } from "../helpers/redis_config";
import { Course } from "../models/Course";
import { commentRoute } from "./comment";

export const postRoute = Router({ mergeParams: true });

const fileUpload = multer({ storage: multer.memoryStorage() }).array("files");

postRoute.post(
	"/create/",
	verifyAccessToken,
	fileUpload,
	async (req: any, res) => {
		const currentUser = await getCurrentUser(req);
		if (currentUser.type !== UserType.PROFESSOR) return res.sendStatus(403);
		if (currentUser.courses.indexOf(req.params.courseId) === -1)
			return res.status(403).send("User not enrolled");

		let course;

		try {
			course = await Course.findById(req.params.courseId);
			if (!course) return res.status(404).send("Course not found");
		} catch (err) {
			return res.status(404).send("Course not found");
		}

		const post = {
			by: currentUser.id,
			title: req.body.title,
			body: req.body.body,
			files: [],
		};

		try {
			for (const file of req.files) {
				// console.log("Uploading " + file.originalname);
				const time = Date.now();
				const storageRef = ref(
					storage,
					`files/${course.id}/${file.originalname + "-" + time}`
				);
				const metadata = {
					contentType: file.mimetype,
				};
				const uploadedFile = await uploadBytesResumable(
					storageRef,
					file.buffer,
					metadata
				);
				// console.log("Uploaded " + file.originalname);
				const fileURL = await getDownloadURL(uploadedFile.ref);
				// console.log(fileURL);
				post.files.push(fileURL);
			}
		} catch (err) {
			console.log(err.message);
			res.status(500).send("File upload error");
		}

		try {
			course.posts.push(post);
			await course.save();
			await redisClient.del("C-" + course.id);
			res.send(course);
		} catch (err) {
			res.status(400).send(err);
		}
	}
);

postRoute.get("/:postId/", verifyAccessToken, async (req: any, res) => {
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

	return res.send(post);
});

postRoute.put(
	"/:postId/",
	verifyAccessToken,
	fileUpload,
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

		const currentUser = await getCurrentUser(req);
		if (currentUser.id !== String(post.by)) return res.sendStatus(403);

		if (currentUser.courses.indexOf(req.params.courseId) === -1)
			return res.status(403).send("User not enrolled");

		try {
			for (const file of req.files) {
				// console.log("Uploading " + file.originalname);
				const time = Date.now();
				const storageRef = ref(
					storage,
					`files/${course.id}/${file.originalname + "-" + time}`
				);
				const metadata = {
					contentType: file.mimetype,
				};
				const uploadedFile = await uploadBytesResumable(
					storageRef,
					file.buffer,
					metadata
				);
				// console.log("Uploaded " + file.originalname);
				const fileURL = await getDownloadURL(uploadedFile.ref);
				// console.log(fileURL);
				post.files.push(fileURL);
			}
		} catch (err) {
			console.log(err.message);
			res.sendStatus(500);
		}

		try {
			post.set({
				title: req.body.title || post.title,
				body: req.body.body || post.body,
			});
			await redisClient.del("C-" + course.id);
			await course.save();
			res.send(post);
		} catch (err) {
			res.status(400).send(err);
		}
	}
);

postRoute.delete("/:postId/", verifyAccessToken, async (req: any, res) => {
	let course;
	try {
		course = await Course.findById(req.params.courseId);
		if (!course) return res.status(404).send("Course not found");
	} catch (err) {
		return res.status(404).send("Course not found");
	}

	const post = course.posts.id(req.params.postId);
	if (!post) return res.status(404).send("Post not found");

	const currentUser = await getCurrentUser(req);
	if (currentUser.id !== String(post.by)) return res.sendStatus(403);

	if (currentUser.courses.indexOf(req.params.courseId) === -1)
		return res.status(403).send("User not enrolled");

	try {
		for (const fileURL of post.files) {
			console.log("Deleting " + fileURL);
			const fileRef = ref(storage, fileURL);
			deleteObject(fileRef)
				.then(() => console.log("Deleted " + fileURL))
				.catch((err) => {
					console.log(err.message);
					res.status(500).send(err);
				});
		}
		await redisClient.del("C-" + course.id);
	} catch (err) {
		console.log(err.message);
		res.status(500).send(err);
	}

	try {
		post.remove();
		await course.save();
		console.log(
			`Deleted post ${req.params.postId} from course ${req.params.courseId}`
		);
		res.sendStatus(204);
	} catch (err) {
		res.status(400).send(err);
	}
});

postRoute.use("/:postId/comment", commentRoute);
