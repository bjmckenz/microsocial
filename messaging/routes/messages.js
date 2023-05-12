const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require('http-status-codes');
var express = require('express');
var bleach = require('bleach');
var router = express.Router();
module.exports.router = router;

const { validate } = require('../../user/utils/schema-validation')
const {uri} = require("../common");
const {db} = require("../db");
const {notifyUsersNewMessage, createEvent} = require('../service_calls');
//const {getUserMessages} = require("../pageMessages");

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: retrieve all messages 
 *     description: Retrieves all messages ordered by thread, timestamp.
 *     operationId: GetMessages
 *     tags: [Messaging API]
 *     responses:
 *       200:
 *         description: A list of all message data
 *         content:
 *           application/json:
 *             schema:
 *               "$ref": "#/components/schemas/messages"
 *             example:
 *               [
 *                 {
 *                   "id": 1,
 *                   "thread": 1,
 *                   "author": 1,
 *                   "content": "Hello I am user 1.",
 *                   "timestamp": 1681943395437,
 *                   "lastedit": 1681943395437,
 *                   "read": 1
 *                 },
 *                 {
 *                   "id": 2,
 *                   "thread": 1,
 *                   "author": 2,
 *                   "content": "Hello user 1, I am user 2.",
 *                   "timestamp": 1681943395581,
 *                  "lastedit": 1681943395581,
 *                  "read": 0
 *                 },
 *                 {
 *                   "id": 6,
 *                   "thread": 2,
 *                   "author": 2,
 *                   "content": "User 2 talking to themselves.",
 *                   "timestamp": 1681943396135,
 *                   "lastedit": 1681943396135,
 *                   "read": 0
 *                 }
 *               ]
 *       404:
 *         description: No such Message
 *         examples: [ "Not Found", "No messages available" ]
 */
router.get("/messages",  (req, res) => {
  //TODO: include dynamic query selection from parameters
  let stmt=db.prepare(`SELECT * FROM messages ORDER BY thread, timestamp`);
  let messages = stmt.all([]);

  if (messages.length < 1) {
    //TODO: error event here
    res.statusMessage = "No messages available";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  messages.uri = uri(`/messages/`);
  res.json(messages);
  createEvent(
      type="Messages => GetMessages",
      severity="info",
      message=`Retrieved all messages, messages.length=${messages.length}`
  )
});

function getUserMessages(threadId){
  const stmt = db.prepare(`SELECT * FROM messages WHERE thread = ? ORDER BY timestamp`);
  let messageCache = stmt.all([threadId]);
  return messageCache;
}
/**
 * @swagger
 * /messages/{thread_id}:
 *   get:
 *     summary: Retrieve all messages in a thread.
 *     description: Retrieves all messages in a thread.
 *     operationId: GetMessagesByThreadId
 *     tags: [Messaging API]
 *     parameters:
 *       - in: path
 *         name: thread_id
 *         description: The id of the thread you wish to read
 *         required: true
 *     responses:
 *       200:
 *         description: A list of all message data
 *         content:
 *           application/json:
 *             schema:
 *               "$ref": "#/components/schemas/messages"
 *             example:
 *               [
 *                 {
 *                   "id": 1,
 *                   "thread": 1,
 *                   "author": 1,
 *                   "content": "Hello I am user 1.",
 *                   "timestamp": 1681943395437,
 *                   "lastedit": 1681943395437,
 *                   "read": 1
 *                 },
 *                 {
 *                   "id": 2,
 *                   "thread": 1,
 *                   "author": 2,
 *                   "content": "Hello user 1, I am user 2.",
 *                   "timestamp": 1681943395581,
 *                   "lastedit": 1681943395581,
 *                   "read": 0
 *                 }
 *               ]
 *       404:
 *         description: No such Message
 *         examples: [ "Not Found", "No messages available" ]
 *       401:
 *         description: Could not parse thread_id
 *         examples: ["Could not parse thread_id"]
 */
router.get("/messages/:thread_id",  (req, res) => {
  let id = parseInt(req.params.thread_id);
  if(isNaN(id) || !id){
    createEvent(
      type="Messages => getMessagesByThreadId",
      severity="low",
      message=`Error parsing id:${id}`
    )
    res.statusMessage("Could not parse thread_id")
    res.status(StatusCodes.BAD_REQUEST).end()
    return
  }

  //Get cached version
  /*
  delStaleMCache()
  let sesId=getSessionId(id)
  messages=getUserMCachePage(sesId)
  */
  messages = getUserMessages(id)

  if (messages.length < 1) {
    createEvent(
      type="Messages => getMessagesByThreadId",
      severity="low",
      message=`GetMessagesByThreadId requested thread that doesn't exist ${id}`
    )
    res.statusMessage = "No such threads";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  messages.uri = uri(`/messages/${messages.id}`);
  res.json(messages);
  createEvent(
    type="Messages => getMessagesByThreadId",
    severity="info",
    message=`Retrieved thread id=${id} thread length=${messages.length}`
  )
});

/**
 * @swagger
 * /messages/{thread_id}:
 *   post:
 *     summary: Create a new message
 *     description: Creates a new message by a thread id.
 *     operationId: PostMessageByThreadId
 *     tags: [Messaging API]
 *     parameters:
 *       - in: path
 *         name: thread_id
 *         description: thread id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/postMessage'
 *     responses:
 *       200:
 *         description: Message Data
 *         content:
 *           application/json:
 *             schema:
 *               "$ref": "#/components/schemas/messages"
 *             example:
 *               {
 *                 "id": 1,
 *                 "author": 1,
 *                 "timestamp": 1681943395437,
 *                 "content": "Hello I am user 1, and I just posted this message.",
 *                 "uri": "/message/1"
 *               }
 *       404:
 *         description: No such Message
 *         examples: [ "Not Found", "No thread available" ]
 *       401:
 *         description: Author is not in thread
 *         examples: ["You are not in this thread"]
 */
router.post("/messages/:thread_id", (req, res) => {
  //TODO: accept pagination parameters IE: load 50 most recent messages
  let message={};
  message.thread = parseInt(req.params.thread_id);
  message.author = parseInt(req.body.author);

  message.content = req.body.content.trim();
  message.content = bleach.sanitize(message.content);

  message.read = 0;
  let current_time = Date.now();
  message.timestamp = current_time;
  message.lastedit = current_time;

  // get users in the thread and check thread exists
  const noteUsers=db.prepare("SELECT user_a, user_b FROM threads WHERE id=?");
  let others=noteUsers.all([message.thread]);
  if(others.length<1){
    createEvent(
      type="Messages => PostNewMessageByThreadId",
      severity="medium",
      message=`Attempted to post to non-existent thread threadId=${message.thread}`
    )
    res.statusMessage="Thread does not exist"
    res.status(StatusCodes.NOT_FOUND).end()
    return
  }

  // check that author is in thread
  others=others[0]
  let threadUsers=[parseInt(others.user_a),parseInt(others.user_b)]
  if(!threadUsers.includes(message.author)){
    createEvent(
      type="Messages => PostNewMessageByThreadId",
      severity="medium",
      message=`Attempted to post to threadId=${message.thread}, even though ${message.author} is not a member.`
    )
    console.log("You are not in this thread")
    res.statusMessage="You are not in this thread"
    res.status(StatusCodes.UNAUTHORIZED).end()
    return
  }

  const stmt = db.prepare("INSERT INTO messages(thread, author, content, timestamp, lastedit, read) VALUES(?,?,?,?,?,?)");
  let info={};
  try {
    info = stmt.run([message.thread, message.author, message.content, message.timestamp, message.lastedit, message.read]);
  } catch (err) {
    createEvent(
      type="Messages => PostNewMessageByThreadId",
      severity="medium",
      message=`Attempted to post to threadId=${message.thread} and failed: ${err}`
    )
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    return;
  }
  message.uri = uri(`/message/${info.lastInsertRowid}`);

  // send notification to each user
  notifyUsersNewMessage(threadUsers,message);

  res.json(message);
  createEvent(
      type="Messages => PostMessageByThreadId",
      severity="info",
      message=`Posted new message thread=${message.thread} author=${message.author} content.length=${message.content.length}`
  )
});
