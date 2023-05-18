var express = require('express');
var router = express.Router();
module.exports.router = router;
var { db } = require('../db')

const checkVersion = (id) => {
    const q = db.prepare('SELECT tou FROM users WHERE id=?;')
    const result = q.all(id)
    return result
}

/*
tou stuff goes here
prompt:
-------- 
CWID % 10 = 4
Task: Add last version of TOU accepted
Notes: (integer, starts at null)

implement these changes:
-------------------------
  * database changes (OK to wipe DB if you must, but do create enough test data to demonstrate -- 5 rows min)
  * validation/verification (except for automatically-set fields)
  * queries based on this field
  * post/put/patch to update DB (except for automatically-set fields)
  --* auto null value for TOU so no POST function
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
 * /user/tou/{id}:
 *  put:
 *      summary: Update users most recent TOU
 *      description: Update users.db to show most recent TOU accepted, int only
 *      operationID: PutTOU
 *      tags: [Users API]
 *      responses:
 *       200:
 *         description: updated TOU version successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *          unkown error
*/
router.put('/user/tou', (req, res) => {
    const { id, tou } = req.body

    if (!id || !tou) {
        res.status(400).json({ error: "Invalid input data" })
    }
    const userVersion = checkVersion(id)
    try {
        if (userVersion == null) {
            const q = db.prepare(`INSERT INTO users (id, tou) VALUES (?, ?)`)
            const result = q.run(id, tou)
            return res.status(200).json({
                data: {
                    id: id,
                    tou: tou
                }
            })
        } else {
            const q = db.prepare(`UPDATE users SET tou=? WHERE id=?`)
            const result = q.run(tou, id)
            return res.status(201).json({
                id: id,
                tou: tou
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(500)
    }
})

/**
 * @swagger
 * /user/tou/{id}: 
 *  get:
 *     summary: Retrieve users most recent TOU
 *     description: Read tou version from user.db
 *     operationId: GetTOU
 *     tags: [Users API]
 *     responses:
 *       200:
 *         description: Success - tou returned
 *       400:
 *         description: Invalid Query
 */
router.get('/user/tou/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        res.status(400).json({ error: "Invalid Query" })
    }
    const q = db.prepare(`SELECT tou FROM users WHERE id=?;`)
    const result = q.all(id)

    return result.length > 0 ? res.status(200).json({ data: result[0] }) : res.status(200).json({ data: {} })
})


