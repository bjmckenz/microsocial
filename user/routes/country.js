var express = require('express');
var router = express.Router();
module.exports.router = router;
var { db } = require('../db')

const checkCountry = (id) => {
    const q = db.prepare('SELECT country FROM users WHERE id=?;')
    const result = q.all(id)
    return result
}
function validate_country(country) {
    var country_pattern = /^(?=.{1,3}?).[A-Za-z]{1,3}$/;
    return country_pattern.test(country); // check validity, test() returns true or false
  }
/*
country stuff goes here
prompt:
-------- 
EXTRA CREDIT
Task: Add country of residence
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
 * /user/country/{id}:
 *  post:
 *      summary: Set users country
 *      description: Set users.db to show user country
 *      operationID: postCountry
 *      tags: [Users API]
 *      responses:
 *       200:
 *         description: country set successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *          unkown error
*/
router.put('/user/country', (req, res) => {
    const { id, country } = req.body

    if (!id || !validate_country(country)) {
        res.status(400).json({ error: "Invalid input data" })
    }
    const userCountry = checkCountry(id)
    try {
        if (userCountry === null) {
            const q = db.prepare(`INSERT INTO users (id, country) VALUES (?, ?)`)
            const result = q.run(id, country)
            return res.status(200).json({
                data: {
                    id: id,
                    country: country
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
 * /user/country/{id}:
 *  put:
 *      summary: Update users set country
 *      description: Update users.db to show current user country
 *      operationID: putCountry
 *      tags: [Users API]
 *      responses:
 *       200:
 *         description: updated country successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *          unkown error
*/
router.put('/user/country', (req, res) => {
    const { id, country } = req.body

    if (!id || !country) {
        res.status(400).json({ error: "Invalid input data" })
    }
    const userCountry = checkCountry(id)
    try {
        if (userCountry === null) {
            const q = db.prepare(`INSERT INTO users (id, country) VALUES (?, ?)`)
            const result = q.run(id, country)
            return res.status(200).json({
                data: {
                    id: id,
                    country: country
                }
            })
        } else {
            const q = db.prepare(`UPDATE users SET country=? WHERE id=?`)
            const result = q.run(country, id)
            return res.status(201).json({
                id: id,
                country: country
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(500)
    }
})

/**
 * @swagger
 * /user/country/{id}: 
 *  get:
 *     summary: Retrieve users country
 *     description: Read country from user.db
 *     operationId: GetCountry
 *     tags: [Users API]
 *     responses:
 *       200:
 *         description: Success - country returned
 *       400:
 *         description: Invalid Query
 */
router.get('/user/country/:id', (req, res) => {
    const { id } = req.params
    if (!id) {
        res.status(400).json({ error: "Invalid Query" })
    }
    const q = db.prepare(`SELECT country FROM users WHERE id=?;`)
    const result = q.all(id)

    return result.length > 0 ? res.status(200).json({ data: result[0] }) : res.status(200).json({ data: {} })
})
