export const development = {
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "",
    database: "jk1",
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations", // Specify the directory for migration files
  },
};
