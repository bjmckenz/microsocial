const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require("http-status-codes");
var express = require("express");


var router = express.Router();
module.exports.router = router;

const { USERS_SERVICE } = require("../common");
const { db } = require("../db");
const { validate } = require("../utils/schema-validation");

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Retrieve a User
 *     description: Retrieve one User by id.
 *     operationId: GetUserById
 *     tags: [Users API]
 *     parameters:
 *       - in: path
 *         name: id
 *         description: user id
 *         required: true
 *         schema:
 *            $ref: '#/components/schemas/UserId'
 *     responses:
 *       200:
 *         description: User Data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RetrievedUser'
 *       404:
 *         description: No such User
 *         examples: [ "Not Found", "No such user" ]
 */
router.get("/user/:id", (req, res) => {
  const id = parseInt(req.params.id);

  errors = validate.UserId(id, "{id}");
  if (errors.length) {
    log_event({
      severity: 'Low',
      type: 'InvalidGet',
      message: `Get User ${id} failed: validation`
    })
    res.json(errors);
    res.statusMessage = "No such user";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }
//part 3 final requirement
  const stmt = db.prepare("SELECT id,name,email,created_on, recovery_email, phone FROM users where id = ?");
  users = stmt.all([id]);

  if (users.length < 1) {
    log_event({
      severity: 'Low',
      type: 'GetNoUser',
      message: `Get ${id} failed: No such User`
    })
    res.statusMessage = "No such user";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  user = users[0];
  user.uri = USERS_SERVICE(`/user/${user.id}`);
  res.json(user);
});

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update User
 *     description: Replace all* fields for one User, by id.
 *     operationId: UpdateUserById
 *     tags: [Users API]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the user.
 *         schema:
 *            type: integer
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/UpdatingUser'
 *     responses:
 *       200:
 *         description: User Updated (all fields)
 *         content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RetrievedUser'
 *       400:
 *          description: Invalid update. (Contents not acceptable)
 *       404:
 *          description: No such User
 *          examples: [ "Not Found", "No such user" ]
 */
router.put("/user/:id", (req, res) => {
  const id = parseInt(req.params.id);

  errors = validate.UserId(id, "{id}");
  if (errors.length) {
    log_event({
      severity: 'Low',
      type: 'NonexistentUserUpdate',
      message: `Update for User ${id} failed: format`
    })
    res.json(errors);
    res.statusMessage = "No such user";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  const updatedUser = req.body;

  errors = validate.UpdatingUser(updatedUser, "{body}");
  if (errors.length) {
    log_event({
      severity: 'Low',
      type: 'InvalidUserUpdate1',
      message: `Update for User ${id} failed: ${JSON.stringify(errors)}`
    })
    res.json(errors);
    res.statusMessage = "Invalid update";
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).end();
    return;
  }
  //part 3 final requirement
  const stmt = db.prepare(`UPDATE users SET name=?, email=?, password=?, recovery_email=?, phone=? WHERE id=?`);

  try {
    //update part 3 final requirement
    info = stmt.run([updatedUser.name, updatedUser.password, updatedUser.email, updatedUser.recovery_email, updatedUser.phone, id]);
    if (info.changes < 1) {
      log_event({
        severity: 'Low',
        type: 'InvalidUserUpdate2',
        message: `Update for User ${id} failed.`
      })
      console.log("update error1: ", { err, info, user });
      res.statusMessage = "Account update failed.";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }
    //test email format
    if (!/^[A-Za-z0-9_.-]{1,64}@[A-Za-z0-9_.-]{1,64}$/.test(updatedUser.email)) {
      throw new Error('Invalid email format');
    }
    //test recovery email format
    if (!/^[A-Za-z0-9_.-]{1,64}@[A-Za-z0-9_.-]{1,64}$/.test(updatedUser.recovery_email)) {
      throw new Error('Invalid recovery email format');
    }
    //test phone format
    if (!/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(updatedUser.phone)) {
      throw new Error('Invalid phone format');
    }

  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE" && err.message.includes("name")) {
      res.statusMessage = "Account with name already exists";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }
    // error message for email
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE" && err.message.includes("email")) {
      res.statusMessage = "Account with email already exists";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }

    // error for email format
    if (err.message === "Invalid email format") {
      res.statusMessage = "Invalid email format";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }

    // error for recovery email format
    if (err.message === "Invalid recovery email format") {
      res.statusMessage = "Invalid recovery email format";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }
    // error for phone format
    if (err.message === "Invalid phone format") {
      res.statusMessage = "Invalid phone format";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }

    
    log_event({
      severity: 'Low',
      type: 'InvalidUserUpdate3',
      message: `Update for User ${id} failed: ${JSON.stringify(err)}`
    })
    console.log("update error2: ", { err, info, user });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    return;
  }

  res.redirect(`${id}`);
});

/**
 * @swagger
 * /user/{id}:
 *   patch:
 *     summary: (Partially) update User fields
 *     description: Replace any submitted fields for one User, by id.
 *     operationId: PatchUserById
 *     tags: [Users API]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the user.
 *         schema:
 *            type: integer
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/PatchingUser'
 *     responses:
 *       200:
 *         description: User Updated (submitted fields only, but all fields returned)
 *         content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RetrievedUser'
 *       400:
 *          description: Invalid update. (Contents not acceptable)
 *       404:
 *          description: User not found
 *          examples: [ "Not Found", "No such user" ]
 */
router.patch("/user/:id", (req, res) => {
  const id = parseInt(req.params.id);

  errors = validate.UserId(id, "{id}");
  if (errors.length) {
    log_event({
      severity: 'Low',
      type: 'InvalidUserPatch1',
      message: `Patch for User ${id} failed: No such user`
    })
    res.json(errors);
    res.statusMessage = "No such user";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  const updatedUser = req.body;

  errors = validate.PatchingUser(updatedUser, "{body}");
  if (errors.length) {
    log_event({
      severity: 'Low',
      type: 'InvalidUserPatch2',
      message: `Update for User ${id} failed: ${JSON.stringify(errors)}`
    })
    res.json(errors);
    res.statusMessage = "Invalid update";
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).end();
    return;
  }

  var info;
  try {
    updateClauses = [];
    updateParams = [];

    if ("name" in updatedUser) {
      updateClauses.push("name = ?");
      updateParams.push(updatedUser.name);
    }

    if ("password" in updatedUser) {
      updateClauses.push("password = ?");
      updateParams.push(updatedUser.password);
    }
    //test email format
    if ("email" in updatedUser) {
      updateClauses.push("email = ?");
      updateParams.push(updatedUser.email);
      if (!/^[A-Za-z0-9_.-]{1,64}@[A-Za-z0-9_.-]{1,64}$/.test(updatedUser.email)) {
        throw new Error('Invalid email format');
      }
    }
    //test recovery email format
    if ("recovery_email" in updatedUser) {
      updateClauses.push("recovery_email = ?");
      updateParams.push(updatedUser.recovery_email);
      if (!/^[A-Za-z0-9_.-]{1,64}@[A-Za-z0-9_.-]{1,64}$/.test(updatedUser.recovery_email)) {
        throw new Error('Invalid recovery email format');
      }
    }
    //test phone format
    if ("phone" in updatedUser) {
      updateClauses.push("phone = ?");
      updateParams.push(updatedUser.phone);
      if (!/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(updatedUser.phone)) {
        throw new Error('Invalid phone format');
      }
    }

    
    const stmt = db.prepare(
      `UPDATE users SET ${updateClauses.join(", ")} WHERE id=?`
    );

    info = stmt.run([...updateParams, id]);
    if (info.changes < 1) {
      log_event({
        severity: 'Low',
        type: 'InvalidUserPatch3',
        message: `Update for User ${id} failed.`
      })
      res.statusMessage = "No such user/Error";
      res.status(StatusCodes.NOT_FOUND).end();
      return;
    }
  } catch (err) {
    // error message for name
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE" && err.message.includes("name")) {
      res.statusMessage = "Account with name already exists";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }
    // error message for email
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE" && err.message.includes("email")) {
      res.statusMessage = "Account with email already exists";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }
    // error for email format
    if (err.message === "Invalid email format") {
      res.statusMessage = "Invalid email format";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }
    // error for recovery email format
    if (err.message === "Invalid recovery email format") {
      res.statusMessage = "Invalid recovery email format";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }
    // error for phone format
    if (err.message === "Invalid phone format") {
      res.statusMessage = "Invalid phone format";
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }

    log_event({
      severity: 'Low',
      type: 'InvalidUserPatch4',
      message: `Update for User ${id} failed: ${JSON.stringify(err)}`
    })
    console.log("update error: ", { err, updatedUser });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    return;
  }

  res.redirect(`${id}`);
});

/**
/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete User
 *     description: Delete this user from the service
 *     operationId: DeleteUserById
 *     tags: [Users API]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the user.
 *         schema:
 *            type: integer
 *     responses:
 *       204:
 *         description: User Deleted
 *       404:
 *          description: No such User
 *          examples: [ "Not Found", "No such user" ]
 */
router.delete("/user/:id", (req, res) => {
  const id = parseInt(req.params.id);

  errors = validate.UserId(id, "{id}");
  if (errors.length) {
    log_event({
      severity: 'Low',
      type: 'DeleteUser1',
      message: `Delete for User ${id} failed: ${JSON.stringify(errors)}`
    })
    res.json(errors);
    res.statusMessage = "No such user";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  const stmt = db.prepare("DELETE FROM users where id = ?");

  info = stmt.run([id]);
  if (info.changes < 1) {
    log_event({
      severity: 'Low',
      type: 'DeleteUser2',
      message: `Delete for User ${id} failed.`
    })
    res.statusMessage = "No such user";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }
  log_event({
    severity: 'Medium',
    type: 'DeleteUser',
    message: `Deleted User ${id}.`
  })

  res.status(StatusCodes.NO_CONTENT).end();
});
