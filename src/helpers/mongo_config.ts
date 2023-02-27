import mongoose from "mongoose";
import "dotenv/config";

mongoose.set("strictQuery", true);

try {
	mongoose.connect(process.env.MONGODB_CONNECT || "", () =>
		console.log("Connected to DB!")
	);
} catch (err) {
	console.log(err);
}

mongoose.connection.on("connected", () => {
	console.log("Mongoose connected to DB!");
});

mongoose.connection.on("error", (err) => {
	console.log(err);
});

mongoose.connection.on("disconnected", () => {
	console.log("Mongoose disconnected!");
});

process.on("SIGINT", async () => {
	await mongoose.connection.close();
	process.exit(0);
});
