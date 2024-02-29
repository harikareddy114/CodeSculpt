const db = require('../db');

class UserModel {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ?';
    const [user] = await db.query(query, [username]);
    return user;
  }

  async save() {
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    await db.query(query, [this.username, this.password]);
  }
}

module.exports = UserModel;
