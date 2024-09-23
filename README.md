# my-drive

This project is a cloud-based storage application that allows authenticated users to upload and manage files.

## Why?

The main goal of this project is to practice and reinforce my understanding of the Prisma ORM and to integrate it with the Cloudinary API for file storage.

### Usage

To get everything working locally, simply:

1. clone the repo with `git clone<repo-url>`, go into the newly created repo and run `npm install`
2. you will need a handfull of environment variables:

```bash
DATABASE_URL=postgress://username:password@localhost:5432/file_uploader
CLOUDINARY_CLOUD_NAME=cloud_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=secret
SESSION_SECRET=secret
```

replacing the rhs with whatever keys/secrets you get for cloudinary/ generate for session

3. generate and migrate the prisma client

```
npx prisma generate
npx prisma migrate dev
```

4. and run the app!

```
node app.js
```

### Technologies used

- express (and related libraries) - to handle building the server and routes
- multer - middleware to simplify handling direct file upload stream from form
- cloudinary API - integrated to store data to cloud
- passport.js - for user authentication and session management
- prisma ORM - for interacting with PostgreSQL db using an ORM
- HTML/CSS - for the front end of the application
