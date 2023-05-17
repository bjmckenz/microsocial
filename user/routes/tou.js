var express = require('express');
var router = express.Router();
module.exports.router = router;
var { db } = require('../db')

const checkVersion = (user_id) => {
    const q = db.prepare('SELECT * FROM user_tou WHERE user_id=?;')
    const result = q.all(user_id)
    return result
}

/**
 * @swagger
 * /user/tou:
 *   post:
 *     summary: Add or update a TOU version!
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
 *               version:
 *                 type: string
 *     responses:
 *       201:
 *         description: successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/user/tou', (req, res) => {
    const { user_id, version } = req.body

    if(!user_id || !version)
        res.status(400).json({error: "Invalid data"})

    const userVersion = checkVersion(user_id)
    try {
        if(userVersion.length === 0) {
            const q = db.prepare(`INSERT INTO user_tou (user_id, version) VALUES (?, ?)`)
            const result = q.run(user_id, version)
            return res.status(201).json({
                data: {
                    id: result.lastInsertRowid,
                    user_id: user_id,
                    version: version
                }
            })
        } else {
            const q = db.prepare(`UPDATE user_tou SET version=? WHERE user_id=?`)
            const result = q.run(version, user_id)
            return res.status(204).json({
                id: result.lastInsertRowid,
                user_id: user_id,
                version: version            
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(500)
    }
})

/**
 * @swagger
 * /user/tou/{user_id}:
 *   get:
 *     summary: Get a tou version by user_id!
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     tags: [Users API]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/user/tou/:user_id', (req, res) => {
    const { user_id } = req.params
    if(!user_id)
        res.status(400).json({ error: "Invalid Id" })
    
    const q = db.prepare(`SELECT * FROM user_tou WHERE user_id=?;`)
    const result = q.all(user_id)

    return result.length > 0 ? res.status(200).json({data: result[0]}) : res.status(200).json({data: {}})
})