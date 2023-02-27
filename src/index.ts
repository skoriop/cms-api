import express, { Application, ErrorRequestHandler } from "express";
import "dotenv/config";

const app: Application = express();

const PORT: number = +(process.env.PORT || 3000);

app.get("/", async (req, res) => {
	res.send({
		message: "pong",
	});
});

app.use(async (req, res, next) => {
	res.status(404).send("This path does not exist.");
});

app.use(((err, req, res, next) => {
	res.status(err.status || res.status || 500);
	res.send({
		error: {
			status: err.status || res.status || 500,
			message: err.message,
		},
	});
}) as ErrorRequestHandler);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
