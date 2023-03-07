import Joi from "joi";

export const validate = (schema: Joi.ObjectSchema) => {
	return async (req, res, next) => {
		const { error } = schema.validate(req.body, {
			abortEarly: false,
			allowUnknown: true,
		});
		if (error) return res.status(400).send(error);

		next();
	};
};

export const userSchema = Joi.object({
	name: Joi.string()
		.strict()
		.trim()
		.regex(new RegExp("^[a-zA-Z ]+$"))
		.required(),
	email: Joi.string().email().required(),
	username: Joi.string().token().required(),
	password: Joi.string()
		.min(6)
		.regex(new RegExp("^[a-zA-Z0-9~@#$^*_+=|,.?:]+$"))
		.required(),
	type: Joi.string().valid("student", "professor", "admin"),
});

export const loginSchema = Joi.object({
	username: Joi.string().token(),
	email: Joi.string().email(),
	password: Joi.string()
		.min(6)
		.regex(new RegExp("^[a-zA-Z0-9~@#$^*_+=|,.?:]+$"))
		.required(),
}).xor("username", "email");

export const updateUserSchema = Joi.object({
	name: Joi.string().strict().trim().regex(new RegExp("^[a-zA-Z ]+$")),
	email: Joi.string().email(),
	username: Joi.string().token(),
	password: Joi.string()
		.min(6)
		.regex(new RegExp("^[a-zA-Z0-9~@#$^*_+=|,.?:]+$")),
	courses: Joi.array().items(Joi.string().hex().length(24)),
});

export const courseSchema = Joi.object({
	code: Joi.string()
		.strict()
		.trim()
		.regex(new RegExp("^[A-Z0-9 ]+$"))
		.required(),
	name: Joi.string()
		.strict()
		.trim()
		.regex(new RegExp("^[a-zA-Z0-9 ]+$"))
		.required(),
});

export const updateCourseSchema = Joi.object({
	code: Joi.string().strict().trim().regex(new RegExp("^[A-Z0-9 ]+$")),
	name: Joi.string().strict().trim().regex(new RegExp("^[a-zA-Z0-9 ]+$")),
});

export const postSchema = Joi.object({
	title: Joi.string().strict().trim().required(),
	body: Joi.string().strict().trim().required(),
	files: Joi.array(),
	scheduled: Joi.boolean(),
	time: Joi.number().integer().positive(),
}).with("scheduled", "time");

export const updatePostSchema = Joi.object({
	title: Joi.string().strict().trim(),
	body: Joi.string().strict().trim(),
	files: Joi.array(),
});

export const commentSchema = Joi.object({
	body: Joi.string().strict().trim().required(),
});

export const updateCommentSchema = Joi.object({
	body: Joi.string().strict().trim(),
});
