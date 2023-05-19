const fs = require("fs");
const { db } = require("./db");

const stmt = db.prepare("INSERT INTO users (name, password, versionkey, email) VALUES (?, ?, 1, ?)");

const csv_data = fs.readFileSync("test_users.csv", "utf8");
csv_data.split("\r\n").forEach((line) => {
  const match = line.match(/^([^,]+),(.*)/);
  const pass = match[1].substring(0, 1) + "123";
  const name = match[1] + match[2].substring(0, 1);
  const email = match[1] + match[2].substring(0, 1) + "@gmail.com"; // added email as load
  console.log({ name, pass, email });

  var info
  try {
    info = stmt.run([name, pass, email]);
  } catch (err) {
    if (err.code !== "SQLITE_CONSTRAINT_UNIQUE") {
      console.log("insert error: ", { err, info, user:{name, pass, email} });
      return;
    }
  }
});
