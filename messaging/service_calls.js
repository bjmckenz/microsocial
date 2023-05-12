const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require('http-status-codes');
var express = require('express');
var router = express.Router();
module.exports.router = router;

const axios = require('axios');
const {uri} = require("./common");
const {db} = require("./db");

/*
    //Example get
    try {
      const res = await axios.get(uri('/message/1', 'Messages'), {
      })
      console.log("result",res.data)
    } catch (error) {
      console.log(error)
    }
    //Example post
    try {
      const res = await axios.post(uri('/messages/30', 'Messages'), {
          author:"6",// <- notice that a string is required because it's set to use .trim()
          content:"I posted this message with an axios api call."
      })
      console.log("result",res.data)
    } catch (error) {
      console.log(error)
    }
*/

async function createEvent(type, severity, message){
  let createdEvent={
      type:type,
      severity:severity,
      message:message
  }
  let res={status:500}
  try {
      res = await axios.post(uri('/events', 'Analytics'),createdEvent)
    } catch (error) {
      console.log(`\tFailed to POST event:\n\t\t${error}`)
      return
  }
  console.log(`\tPOST event type:"${type}", status ${res.status}`);
}

async function createPostMessageEvent(message) {
  createEvent(
    type="Messages/postMessage",
    severity="info",
    message=JSON.stringify({
      thread:message.thread,
      author:message.author,
      messageid:message.id,
      messagelen:message.content.length
    })
  );
}

async function isBlocked(users) {
    //check with relationship and see if users are blocked
    return false;
}

async function getUserInfo(userId) {
    let myUri=`/user/${userId}`
    let userInfo={username:userId,uri:myUri}
    let userStatus=StatusCodes.BAD_REQUEST
    try {
      // Grab user name for notification service
      userInfo=await axios.get(uri(myUri,'Users'),{});
      userStatus=userInfo.status
      if('data' in userInfo){
          userInfo=userInfo.data
          //console.log("userInfo ",userInfo)
      }
      else{
        //console.log('\t\tFailed to fetch user info, defaulting to uri')
        throw "No user data"
      }
    } catch (error) {
       console.log('\t\tFailed to fetch user info, defaulting to uri')
       createEvent(
          type="Messages => User",
          severity="medium",
          message=`failed to fetch:"${myUri}"...\n${error}`
       )
    }
    console.log(`\tGET User type: "Messaging => User/${userId}", status ${userStatus}`);
    return userInfo
}

//TODO: Identify directions of new Thread Status user -> other users
async function notifyUsersNewThread(threadMembers) {
  for(let person in threadMembers){
    let recipient=await getUserInfo(threadMembers[person]);
    let res={status:StatusCodes.BAD_REQUEST}
    try {
      // Grab user name for notification service
      let data={
          sender_username: 'MessagingSystem',
          receiver_username: recipient.name,
          action: `You recieved a new Conversation`,//"${authname.name}"`, username or thread uri
          read: 0
        }
      // send data to notifications
      const res = await axios.post(uri('/notification/create', 'Notifications'),
          data
      )
      console.log(`\tPOST notification type: "Messaging => Notification/create", New Thread, status ${res.status}`);
    } catch (error) {
        console.log(`\tPOST notification type: "Messaging => Notification/create", New Thread, status ${res.status}`);
        createEvent(
          type="Messages => Notifications",
          severity="medium",
          message=`failed to POST:notification...\n${error}`
        )
    }
  }
}

async function notifyUsersNewMessage(threadMembers,message,action) {
  let authname = await getUserInfo(message.author);
  for(let person in threadMembers){
    let noteStatus=400;
    if(!person || threadMembers[person]===message.author){
        continue;
    }
    try {
      // Grab user name for notification service
      let recipient=await getUserInfo(threadMembers[person]);
      let data={
          sender_username: authname.name,
          receiver_username: recipient.name,
          action: "You recieved a new message -> \""+message.content.slice(0,5)
            +"...\" @ /messages/"+message.thread,
          read: 0
        }
      // send data to notifications
      const res = await axios.post(uri('/notification/create', 'Notifications'),
          data
      )
      noteStatus=res.status
      console.log(`\tPOST notification type: "Messaging => Notification/create", New Message, status ${noteStatus}`);
    } catch (error) {
        console.log(`\tPOST notification type: "Messaging => Notification/create", New Message, status ${noteStatus}`);
        createEvent(
        type="Messages => Notifications",
        severity="medium",
        message=`failed to POST:notification...\n${error}`
        )
    }
  }
}

module.exports.notifyUsersNewMessage = notifyUsersNewMessage;
module.exports.notifyUsersNewThread= notifyUsersNewThread;
module.exports.isBlocked = isBlocked;
module.exports.createPostMessageEvent = createPostMessageEvent;
module.exports.createEvent = createEvent;
