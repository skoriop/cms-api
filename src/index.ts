import express from "express";
import "dotenv/config";

import "./helpers/mongo_config";
import "./helpers/firebase_config";
import "./helpers/gmail_config";
import "./helpers/redis_config";

import { authRoute } from "./controllers/auth";
import { userRoute } from "./controllers/user";
import { courseRoute } from "./controllers/course";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/course", courseRoute);

app.get("/", async (req, res) => {
	return res.send({
		message: "pong",
	});
});

app.use(async (req, res, next) => {
	return res.status(404).send("This path does not exist.");
});

app.use((err, req, res, next) => {
	return res.status(err.status || res.status || 500).send({
		error: {
			status: err.status || res.status || 500,
			message: err.message,
		},
	});
});

app.listen(process.env.API_PORT, () => {
	console.log(`Running on port ${process.env.API_PORT}!`);
});
