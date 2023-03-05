import mongoose from "mongoose";
import "dotenv/config";

mongoose.set("strictQuery", true);

try {
	mongoose.connect(process.env.MONGODB_DATABASE_URL || "", () =>
		console.log("Connected to MongoDB!")
	);
} catch (err) {
	console.log(err);
}

mongoose.connection.on("connected", () => {
	console.log("Mongoose connected to MongoDB!");
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
