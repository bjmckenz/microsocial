const fs = require("fs");
const { db } = require("./db");

const stmt = db.prepare("INSERT INTO users (name, password, versionkey, country) VALUES (?, ?, 1, USA)");

const csv_data = fs.readFileSync("test_users.csv", "utf8");
csv_data.split("\r\n").forEach((line) => {
  const match = line.match(/^([^,]+),(.*)/);
  const pass = match[1].substring(0, 1) + "123";
  const name = match[1] + match[2].substring(0, 1);
  console.log({ name, pass });

  var info
  try {
    info = stmt.run([name, pass]);
  } catch (err) {
    if (err.code !== "SQLITE_CONSTRAINT_UNIQUE") {
      console.log("insert error: ", { err, info, user:{name,pass} });
      return;
    }
  }
});
