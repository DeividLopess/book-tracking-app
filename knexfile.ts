export default {
  client: "sqlite3",
  connection: {
    filename: "./database/database.db",
  },
  pool: {
    afterCreate: (conn: any, done: any) => {
      conn.run("PRAGMA foreign_keys = ON", done);
    },
  },
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./database/migrations",
  },
  seeds: {
    extension: "ts",
    directory: "./database/seeds",
  },
};
