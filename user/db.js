const Database = require('better-sqlite3')
var db = new Database('./users.db')


// first time, or if we delete/reset users.db
db.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password TEXT NOT NULL,
        versionkey INTEGER NOT NULL DEFAULT 1,
        datecreated INTEGER NOT NULL,
        accountstatus BOOLEAN NOT NULL DEFAULT 1,
        lastlogin INTEGER DEFAULT NULL
            CHECK(datecreated<=lastlogin),
        emailaddress TEXT DEFAULT NULL,
        touversion INTEGER DEFAULT NULL,
        passhint TEXT
            CHECK(password!=passhint),
        country TEXT,
        phonenumber TEXT,
        twofactormethod TEXT NOT NULL DEFAULT 'none',
        recoveryemail TEXT 
            CHECK(emailaddress!=recoveryemail)
    );`)
db.exec(`CREATE TABLE IF NOT EXISTS users_result_sets (
        set_id INTEGER PRIMARY KEY AUTOINCREMENT,
        set_session_id TEXT,
        set_querying_user_id INTEGER,
        set_results_as_of TEXT NOT NULL,
        set_rownum INTEGER,
        id INTEGER,
        name TEXT,
        versionkey INTEGER,
        datecreated INTEGER NOT NULL,
        accountstatus BOOLEAN NOT NULL,
        lastlogin INTEGER DEFAULT NULL,
        emailaddress TEXT DEFAULT NULL,
        touversion INTEGER DEFAULT NULL,
        passhint TEXT,
        country TEXT,
        phonenumber TEXT,
        twofactormethod TEXT NOT NULL,
        recoveryemail TEXT 
    );
    `)
db.exec(`CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        refresh_token TEXT NOT NULL, 
        issued TEXT,
        expires TEXT
    )`)

function typeConvertAndFill(params, fill=false){
  console.log(params)
  if(!params){
      return
  }
  const intSet = [
    "datecreated",
    "lastlogin",
    "touversion",
    "accountstatus"
  ]
  const nullableSet=[
    'lastlogin','emailaddress','touversion','country','passhint','phonenumber','recoveryemail'
  ]

  for(convert in intSet){
      if(params[intSet[convert]]!=='null' && intSet[convert] in params){
      console.log('CONVERTING',intSet[convert])
      params[intSet[convert]]=parseInt(params[intSet[convert]])
    }
  }

  for(exists in nullableSet){
    if((fill && !nullableSet[exists] in params) ||params[nullableSet[exists]] === 'null'){
        params[nullableSet[exists]]=null
    }
  }
  return params
}

// I have no idea why I had to do this. The get() is NOT defined in my DB for some reason. This polyfills it. BJM 4/15/23
db.get = (stmt, params) => {
  prep = db.prepare(stmt)
  results = prep.all(params)
  return results ? results[0] : undefined
}

module.exports.db = db
module.exports.typeConvertAndFill = typeConvertAndFill
