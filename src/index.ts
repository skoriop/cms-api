import express, { Application, ErrorRequestHandler } from "express";
import "dotenv/config";

import "./helpers/mongo_config";

import { authRoute } from "./controllers/auth";
import { userRoute } from "./controllers/user";
import { courseRoute } from "./controllers/course";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/course", courseRoute);

app.get("/", async (req, res) => {
	res.send({
		message: "pong",
	});
});

app.use(async (req, res, next) => {
	res.status(404).send("This path does not exist.");
});

app.use(((err, req, res, next) => {
	res.status(Math.floor(err.status) || Math.floor(Number(res.status)) || 500);
	res.send({
		error: {
			status:
				Math.floor(err.status) || Math.floor(Number(res.status)) || 500,
			message: err.message,
		},
	});
}) as ErrorRequestHandler);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
