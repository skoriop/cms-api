import amqplib, { Channel } from "amqplib";
import "dotenv/config";
import { Course } from "../models/Course";
import { sendCourseUpdateEmail } from "./gmail_config";
import { redisClient } from "./redis_config";

export let producer: Channel;

(async () => {
	try {
		const conn = await amqplib.connect(process.env.RABBITMQ_INSTANCE_URL);
		console.log("Connected to RabbitMQ!");

		process.once("SIGINT", conn.close.bind(conn));

		conn.on("close", () => {
			console.log("\nDisconnected from RabbitMQ!");
		});

		producer = await conn.createChannel();

		producer.on("close", () => {
			console.log("\nProducer channel disconnected!");
		});

		await producer.assertExchange("INTERMEDIATE_EXCHANGE", "fanout");
		await producer.assertExchange("FINAL_EXCHANGE", "fanout");
		await producer.assertQueue("INTERMEDIATE_QUEUE", {
			deadLetterExchange: "FINAL_EXCHANGE",
		});
		await producer.assertQueue("FINAL_QUEUE");
		await producer.bindQueue(
			"INTERMEDIATE_QUEUE",
			"INTERMEDIATE_EXCHANGE",
			""
		);
		await producer.bindQueue("FINAL_QUEUE", "FINAL_EXCHANGE", "");

		const consumer = await conn.createChannel();

		consumer.on("close", () => {
			console.log("\nConsumer channel disconnected!");
		});

		await consumer.assertExchange("FINAL_EXCHANGE", "fanout");
		await consumer.assertQueue("FINAL_QUEUE");
		await consumer.bindQueue("FINAL_QUEUE", "FINAL_EXCHANGE", "");

		consumer.consume(
			"FINAL_QUEUE",
			async (raw) => {
				if (!raw) return;
				const msg = JSON.parse(raw.content.toString());

				const course = await Course.findById(msg.courseId);
				if (!course) return;

				try {
					course.posts.push(msg.post);
					await course.save();

					await redisClient.set(
						"C-" + course.id,
						JSON.stringify(course),
						{ XX: true }
					);

					const err = await sendCourseUpdateEmail(course);
					if (err) throw err;
				} catch (err) {
					console.log(err);
				}
			},
			{ noAck: true }
		);

		console.log("RabbitMQ setup finished!");
	} catch (err) {
		console.log(err);
	}
})();
