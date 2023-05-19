const sqlite3 = require('sqlite3').verbose();
const faker = require('faker');

// Connect to the database
const db = new sqlite3.Database('test.db');

// Create a table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT
  )
`);

// Generate test data
for (let i = 0; i < 5; i++) {
  const name = faker.name.findName();
  const email = faker.internet.email();
  const phone = faker.phone.phoneNumber();

  // Insert data into the table
  db.run(
    'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
    [name, email, phone]
  );
}

// Close the database connection
db.close();

console.log("Test data generated successfully!");
