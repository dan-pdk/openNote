import { Pool } from "pg"

const pool = new Pool({
    host: "localhost",
    user: "POSTGRES",
    password: "password",
    database: "postgres",
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