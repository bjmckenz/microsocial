var express = require('express');
var router = express.Router();
module.exports.router = router;
const { db } = require("../db");

/**
 * @swagger
 * /user/phone:
 *   put:
 *     summary: Update a phone number!
 *     tags: [Users API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               phonenumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Changed successfully
 *       400:
 *         description: Invalid input data
 */
router.put('/user/phone', (req, res) => {
    const { user_id, phonenumber } = req.body
    const q = db.prepare(`UPDATE users SET phonenumber=? WHERE id=?`)
    const result = q.run(phonenumber, user_id).changes
    if (result > 0) res.status(204).json({ message: 'success' })
    else res.status(404).json({ error: 'Id not found' })
  })

  /**
 * @swagger
 * /user/phone/{user_id}:
 *   get:
 *     summary: Get a phone!
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     tags: [Users API]
 *     responses:
 *       200:
 *         description: Post route text
 */
router.get('/user/phone/:user_id', (req, res) => {
    const { user_id } = req.params
    const q = db.prepare(`SELECT phonenumber FROM users WHERE id=?`)
    const result = q.all(user_id)
    if (result) return res.status(200).json({ result: result })
    else return res.status(404).json({ error: 'Item not found' })
  })