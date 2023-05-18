var express = require('express');
var router = express.Router();
module.exports.router = router;
var { db } = require('../db')

const checkEmail = (id) => {
    const q = db.prepare('SELECT email FROM users WHERE id=?;')
    const result = q.all(id)
    return result
}
function validate_email(email) {
    var email_pattern = /^(?=.{1,32}$)[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,3}$/;
    return email_pattern.test(email); // check validity, test() returns true or false
  }
/*
email stuff goes here
prompt:
-------- 
EXTRA CREDIT
Task: Add users email address
Notes: :)

implement these changes:
-------------------------
  * database changes (OK to wipe DB if you must, but do create enough test data to demonstrate -- 5 rows min)
  * validation/verification (except for automatically-set fields)
  * queries based on this field
  * post/put/patch to update DB (except for automatically-set fields)
  * display in /users/ and /user
  * description in swagger
Then create a pull request to Bruce's repo, and upload your link to the PR in the 'quiz'.

Scoring:
---------
150 points

  * Functionality/completeness - functions+swagger+db, etc. It works.   - 50 points
  * Cleanliness - style, sane/appropriate names                         - 50 points
  * meta - no warnings anywhere, clean PR (branch!)                     - 50 points

*/
/**
 * @swagger
 * /user/email/{id}:
 *  post:
 *      summary: Set users email
 *      description: Set users.db to show user email
 *      operationID: postEmail
 *      tags: [Users API]
 *      responses:
 *       200:
 *         description: email set successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *          unkown error
*/
router.put('/user/email', (req, res) => {
    const { id, email } = req.body

    if (!id || !validate_email(email)) {
        res.status(400).json({ error: "Invalid input data" })
    }
    const userEmail = checkEmail(id)
    try {
        if (userEmail === null) {
            const q = db.prepare(`INSERT INTO users (id, email) VALUES (?, ?)`)
            const result = q.run(id, email)
            return res.status(200).json({
                data: {
                    id: id,
                    email: email
                }
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(500)
    }
})
/**
 * @swagger
 * /user/email/{id}:
 *  put:
 *      summary: Update users email
 *      description: Update users.db to show current user email
 *      operationID: putEmail
 *      tags: [Users API]
 *      responses:
 *       200:
 *         description: updated email successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *          unkown error
*/
router.put('/user/email', (req, res) => {
    const { id, email } = req.body

    if (!id || !email) {
        res.status(400).json({ error: "Invalid input data" })
    }
    const userEmail = checkEmail(id)
    try {
        if (userEmail === null) {
            const q = db.prepare(`INSERT INTO users (id, email) VALUES (?, ?)`)
            const result = q.run(id, email)
            return res.status(200).json({
                data: {
                    id: id,
                    email: email
                }
            })
        } else {
            const q = db.prepare(`UPDATE users SET email=? WHERE id=?`)
            const result = q.run(email, id)
            return res.status(201).json({
                id: id,
                email: email
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(500)
    }
})

/**
 * @swagger
 * /user/email/{id}: 
 *  get:
 *     summary: Retrieve users email
 *     description: Read email from user.db
 *     operationId: GetEmail
 *     tags: [Users API]
 *     responses:
 *       200:
 *         description: Success - email returned
 *       400:
 *         description: Invalid Query
 */
router.get('/user/email/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        res.status(400).json({ error: "Invalid Query" })
    }
    const q = db.prepare(`SELECT email FROM users WHERE id=?;`)
    const result = q.all(id)

    return result.length > 0 ? res.status(200).json({ data: result[0] }) : res.status(200).json({ data: {} })
})
