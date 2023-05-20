# Final Exam
Student ID =  888672102 
% 10 = 2 => ADD DATE OF LAST LOG IN
Start NULL => could make one when user is created

EC:
ADD LAST VERSION OF TOU ACCEPTED, starts NULL.
ADD EMAIL OF ACCOUNT DURING CREATING AND UPDATE
# microsocial

We're having some fun now!

Fork this, then clone that.

make a change, push to your fork, and file a PR (pull request) to this repo.

(If I don't see the PR instantly, say something chat, or text)

Please make the services live in a simply named directory (e.g. "user").

## Updates and changes 4/14

### Use those schemas for input validation (so we don't write it manually)
Take a look at ```user/routes/user.js``` and look for "validate(" To get this goodness, copy ```utils/schema.js, utils/schema-validation.js``` (you'll want to update ```docs.js``` too at least). Magic!

This implements DRY (Don't Repeat Yourself) by only specifying validation in ONE place (the schemas). The code is shorter and cleaner and less likely to break.

## Updates and changes 4/13

### BUG FIXES
* Bad status code names fixed.

### Test data for users present
* You'll see a pattern for that in ```db.js```.

### Authentication
Temporarily turned off. Probably back on in a day or so.

### Service split
Split out /auth, /docs to different route/.js files. No change elsewhere (by you) required, I think.

### watching for source changes
You know how you save a file and forget to restart the service? Not any more! Start your services with ```npm run watch``` and it will auto-restart if any source file changes (except *.db).

### Set up for pushing to production
As a Best Practice, I've moved ```TOKEN_SECRET``` into ```.env```. This means that the development version uses what you see there, and the production version (say Heroku) can have secure variables set and never checked into Github. **This is an important pattern**.

### Unprotected Paths
Imagine that we were accepting clients. Which service routes are open to non-users (i.e. guests). **Put those paths in ```unprotectedPaths.js``` in your service** Note that the keys can be "exact", "regex", or "head".

# FUTURE

## Short-term plans
### cursor/pagination of /users to show how to handle large sets
### query/sort, same
### Clean up
* Clean up common.js, make it a proper config file
* move utils and app.js to a higher level so we don't duplicate them
* better trapping of 500
### finishing authentication

### Possibles
* PATCH conflict management (requires DB change)
* PATCH "upsert" (insert if not present)
* problem+json for errors ('standard')
* A sample front end (probably in Svelte)

### Long Shots
* Role-based access control (to show how it's done)
* Add XML as an output

# BEGINNING A SERVICE 

## Beginning your service (notes)

### Get User's service / working
That will get you confident that your install is good.

Hit http://localhost:8000/ and http://localhost:8000/docs

*(Note that /docs will include ***all*** services if you write clean @swagger definitions)*

### Create your new service dir
Under the root, say "foo" service

### Copy most everything from user/ into your dir
*.js, jsdoc.json, package.json, routes/.
Don't run yet.
**All subsequent comments are about your service. You should not have to touch/modify anything in the user folder**
cd into your directory

### tweak the project name in your package.json

### Install packages
```npm install```

### tweak common.js as needed
Don't run yet

### delete all but base routes from your routes/ directory
leave ```base.js``` there.

### tweak your base page in routes/base.js
make it different

### now start your service
```node app.js```

### Profit!
You can create a new terminal in VS Code. cd into the user directory and run its service TOO.
```node app.js```
Now you're running both services simultaneously!
You can access them both (by port number) in Postman.
