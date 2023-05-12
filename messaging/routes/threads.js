const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require('http-status-codes');
var express = require('express');
var router = express.Router();
module.exports.router = router;

const { validate } = require('../../user/utils/schema-validation')
const { uri,fetch } = require('../common')
const {db} = require("../db");
const {notifyUsersNewMessage,
    notifyUsersNewThread,
    isBlocked,
    createEvent} = require('../service_calls');

/**
 * @swagger
 * /threads/{user_id}:
 *   get:
 *     summary: retrieve all threads by userid
 *     description: Retrieves all threads available to user by id
 *     operationId: GetThreadsById
 *     tags: [Messaging API]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         description: user id
 *         required: true
 *     responses:
 *       200:
 *         description: {/user/id : /messages/thread_id}
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "[\"/user/2\"]": ["/messages/1"],
 *                 "[\"/user/3\"]": ["/messages/3", "/messages/4"]
 *               }
 *       404:
 *         description: No such Message
 *         examples: [ "Not Found", "No threads found" ]
 */
router.get("/threads/:user_id", (req, res) => {
  //TODO: add last touched date or otherwise sort threads by activity
  const id = parseInt(req.params.user_id);

  const stmt = db.prepare("SELECT id,user_a,user_b FROM threads WHERE user_a=? OR user_b=?");
  threads = stmt.all([id, id]);

  if (threads.length < 1) {
    createEvent(
      type="Messages => PostNewThread",
      severity="info",
      message=`Get threads userId=${id} returned 0 results`
    )
    res.statusMessage = "No threads found";
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  function not_me(me,user_a,user_b){
      if(me===user_a){return [`/user/${user_b}`];}
      else if(me===user_b){return [`/user/${user_a}`];}
  }

  /*
   * Orangize result into {[other thread participant uris]:[messages/thread_id for those users]}
   */
  let conversations={};
  let convI=0;
  for(convIndex in threads){
    let element=threads[convIndex]
    let convHead=JSON.stringify(not_me(id,element.user_a,element.user_b))
    if(conversations[convHead]){
      conversations[convHead].push(`/messages/${element.id}`)
    }
    else{
      conversations[convHead]=[`/messages/${element.id}`]
    }
    convI+=1;
  }
  res.json(conversations);
  createEvent(
      type="Messages => GetThreadsByID",
      severity="info",
      message=`Fetched threads userId="${id}", total conversations: ${convI} with ${conversations.length} groups`
  )
});

/**
 * @swagger
 * /threads:
 *   post:
 *     summary: post new thread 
 *     description: Post new thread between two users
 *     operationId: PostNewThread
 *     tags: [Messaging API]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/postThread'
 *     responses:
 *       200:
 *         description: Thread Data
 *         content: 
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/threads'
 *             example:
 *               {
 *                 "users": [1,2],
 *                 "id": 1,
 *                 "uri": "/messages/1"
 *               }
 *       404:
 *         description: No such Message
 *         examples: [ "Not Found", "No threads found" ]
 *       400:
 *         description: Could not proccess users
 *         example: ["Could not proccess users", "incompatible number of users", "One or more users does not exist"]
 */
router.post("/threads", (req, res) => {
  let thread={};
  let users=req.body.userGroup;
  validate.postThread(req)

  //TODO: Postman sends as string, but /docs sends as object, quick patch, needs attention.
  if(typeof users===typeof ""){
    users=JSON.parse(users);
  }
  if(users.length!=2){
      //TODO: error event here
      let eventStatus=StatusCodes.BAD_REQUEST
      createEvent(
        type="Messages => PostNewThread",
        severity="medium",
        message=`Invalid users value in PostNewThread, returning ${eventStatus}`
      )
      res.statusMessage = "incompatible number of users";
      res.status(eventStatus).end();
      return;
  }
  let user_a = users[0];
  let user_b = users[1];

  //TODO: Check with users to see if uri's are valid
  let users_are_invalid=false;
  if (
      users_are_invalid
  ) {
    res.statusMessage = "One or more users does not exist";
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  // Check with relationship to see if users are blocked
  /*
  if (
      isBlocked(users)
  ) {
    res.statusMessage = "This user has blocked you";
    res.status(StatusCodes.UNPROCESSABLE_CONTENT).end();
    return;
  }
  */

  let stmt = db.prepare(`INSERT INTO threads(user_a, user_b)
                 VALUES(?, ?)`);
  let info={};
  try {
     info = stmt.run([user_a, user_b]);
  } catch (err) {
    createEvent(
      type="Messages => PostNewThread",
      severity="high",
      message=`Insert error in PostNewThread: ${err}`
    )
    console.log("insert error: ", { err, info, user });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    return;
  }

  thread.id = info.lastInsertRowid;
  thread.uri = uri(`/messages/${thread.id}`);
  thread.users=[user_a,user_b];
  
  res.set('Location',thread.uri);
  res.type('json');
  res.json(thread);
  res.status(StatusCodes.CREATED);

  notifyUsersNewThread(thread.users);
  createEvent(
      type="Messages => PostNewThread",
      severity="info",
      message=`New thread id=${thread.id} users=${thread.users}`
  )
});
