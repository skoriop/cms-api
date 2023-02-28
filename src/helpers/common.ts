import { User } from "../models/User";

export enum UserType {
	ADMIN = "admin",
	PROFESSOR = "professor",
	STUDENT = "student",
}

export const getCurrentUser = async (req: any) => {
	const userId = req.payload.aud;
	const user = await User.findOne({ _id: userId });
	return user;
};
