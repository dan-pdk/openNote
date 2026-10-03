import { Pool } from "pg"
const env = process.env

console.log(process.env)

const pool = new Pool({
    host: "localhost",
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: 5432,
    idleTimeoutMillis: 30000
})

pool.on('error', (error, client) => {
    console.log(error)
})

async function check() {
    console.log((await pool.query("SELECT NOW()")).rows)
}
check()

//node --env-file ../.env .\testConnection.mjs