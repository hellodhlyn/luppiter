module.exports = {
  name: "default",
  type: "postgres",
  host: "127.0.0.1",
  port: "5432",
  username: "postgres",
  password: "<set envvar TYPEORM_PASSWORD>",
  database: "luppiter",
  entities: ["dist/models/**/*.js"],
  migrations: ["src/migration/*.ts"],
  cli: {
    migrationsDir: "src/migration"
  },
}
