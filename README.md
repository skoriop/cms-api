# CMS API

This is a backend API for an educational CMS built with Express.js and Typescript on a MongoDB database.

It uses Firebase for file storage, Redis for caching, RabbitMQ as a message broker and Gmail API for email notifications.

## Setup

Requirements:

-   Node.js
-   A MongoDB cluster
-   Firebase Cloud Storage credentials
-   A Redis instance
-   A RabbitMQ instance

Fill up the `.env-example` file and rename it to `.env`. After that, run:

```bash
npm install
npm run build
npm run start
```

## API Description:

| Endpoint                                               | Method | Description                                        |       Body        |     Bearer Token     |             User Permissions             |         Response         |
| :----------------------------------------------------- | :----: | -------------------------------------------------- | :---------------: | :------------------: | :--------------------------------------: | :----------------------: |
| `/auth/register`                                       |  POST  | Register new user                                  |  `<userSchema>`   | optional (see below) |                    -                     |      `<userSchema>`      |
| `/auth/login`                                          |  POST  | Login user                                         |  `<loginSchema>`  |          -           |                    -                     | `<userSchema>, <tokens>` |
| `/auth/refresh-token`                                  |  POST  | Generate new `accessToken`                         | `<refreshToken>`  |          -           |                    -                     |     `<accessToken>`      |
| `/auth/logout`                                         |  POST  | Logout user                                        | `<refreshToken>`  |   `<accessToken>`    |                    -                     |            -             |
| `/auth/confirm/{code}`                                 |  GET   | Callback URL for email verification on registering |         -         |          -           |                    -                     |      `<userSchema>`      |
| `/user/me`                                             |  GET   | Get current user info                              |         -         |   `<accessToken>`    |                    -                     |      `<userSchema>`      |
| `/user/me`                                             |  PUT   | Modify current user info                           |  `<userSchema>`   |   `<accessToken>`    |                    -                     |      `<userSchema>`      |
| `/user/me`                                             | DELETE | Delete current user                                |         -         |   `<accessToken>`    |                    -                     |            -             |
| `/user/{userId}`                                       |  GET   | Get user info                                      |         -         |   `<accessToken>`    |                    -                     |      `<userSchema>`      |
| `/user/{userId}`                                       |  PUT   | Modify user info                                   |  `<userSchema>`   |   `<accessToken>`    |           Same User (or) Admin           |      `<userSchema>`      |
| `/user/{userId}`                                       | DELETE | Delete user                                        |         -         |   `<accessToken>`    |           Same User (or) Admin           |            -             |
| `/course/create`                                       |  POST  | Create new course                                  | `<courseSchema>`  |   `<accessToken>`    |                Professor                 |     `<courseSchema>`     |
| `/course/{courseId}`                                   |  GET   | Get course details (cached)                        |         -         |   `<accessToken>`    |              Enrolled User               |     `<courseSchema>`     |
| `/course/{courseId}`                                   |  PUT   | Modify course details                              | `<courseSchema>`  |   `<accessToken>`    |            Enrolled Professor            |     `<courseSchema>`     |
| `/course/{courseId}`                                   | DELETE | Delete course                                      |         -         |   `<accessToken>`    |            Enrolled Professor            |            -             |
| `/course/{courseId}/enroll/{userId}`                   |  POST  | Enroll user in course                              |         -         |   `<accessToken>`    |            Enrolled Professor            |            -             |
| `/course/{courseId}/unenroll/{userId}`                 |  POST  | Unenroll user in course                            |         -         |   `<accessToken>`    |            Enrolled Professor            |            -             |
| `/course/{courseId}/post/create`                       |  POST  | Create new post                                    |  `<postSchema>`   |   `<accessToken>`    |            Enrolled Professor            |      `<postSchema>`      |
| `/course/{courseId}/post/{postId}`                     |  GET   | Get post details                                   |         -         |   `<accessToken>`    |              Enrolled User               |      `<postSchema>`      |
| `/course/{courseId}/post/{postId}`                     |  PUT   | Modify post details                                |  `<postSchema>`   |   `<accessToken>`    |               Post Author                |      `<postSchema>`      |
| `/course/{courseId}/post/{postId}`                     | DELETE | Delete post                                        |         -         |   `<accessToken>`    |               Post Author                |            -             |
| `/course/{courseId}/post/{postId}/comment/create`      |  POST  | Create new comment                                 | `<commentSchema>` |   `<accessToken>`    |              Enrolled User               |    `<commentSchema>`     |
| `/course/{courseId}/post/{postId}/comment/{commentId}` |  GET   | Get comment details                                |         -         |   `<accessToken>`    |              Enrolled User               |    `<commentSchema>`     |
| `/course/{courseId}/post/{postId}/comment/{commentId}` |  PUT   | Modify comment details                             | `<commentSchema>` |   `<accessToken>`    |              Comment Author              |    `<commentSchema>`     |
| `/course/{courseId}/post/{postId}/comment/{commentId}` | DELETE | Delete comment                                     |         -         |   `<accessToken>`    | Comment Author (or) Professor (or) Admin |            -             |

The schemas can be found in `models/` or `helpers/validation.ts`. Some other things to note:

-   `/auth/register` can optionally be called with an access token. If it matches `ADMIN_ACCESS_TOKEN`, the type of the newly-created user will match `type` from the request body.

    If no token or some other token is provided, the `type` parameter is ignored and a Student is created by default. This allows authorised creation of Admin and Professor accounts.

-   `/auth/login` can be provided with either username or email.

-   All endpoints that require `<accessToken>` also need the user's email to be verified.

-   `/course/create` automatically enrolls the course creator.

-   `PUT /course/{courseId}` does not update `users` (use the `enroll` / `unenroll` endpoints instead).

-   `/course/{courseId}/post/create` accepts only `multipart/form-data` for file uploads.

-   `/course/{courseId}/post/create` can optionally have a `scheduled` parameter. If it is set to `true`, the post is scheduled to be created at the Unix time given by the `time` parameter.
