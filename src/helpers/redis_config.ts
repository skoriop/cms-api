import { createClient } from "redis";
import "dotenv/config";

export const redisClient = createClient({ url: process.env.REDIS_URL });

(async () => {
	await redisClient.connect();
})();

redisClient.on("ready", () => {
	console.log("Connected to Redis!");
});

redisClient.on("error", (err) => {
	console.log(err.message);
});

redisClient.on("end", () => {
	console.log("\nDisconnected from Redis!");
});

process.on("SIGINT", async () => {
	await redisClient.quit();
});
