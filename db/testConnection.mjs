import { Pool } from "pg"
const env = process.env

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
    console.log((await pool.query("SELECT * FROM usuarios")).rows)
    console.log((await pool.query("SELECT * FROM sala_membros WHERE id_usuario = $1", ["01a2099d-0ebd-7584-b829-6efce93afa1c"])));
    console.log((await pool.query("INSERT INTO usuarios (id, username, email) VALUES ('01a2099d-0ebd-7584-b829-6efce93afa1b', 'eardog2', 'ear@dog2.com');")));
    console.log((await pool.query("INSERT INTO salas (nome, icone_url, lider_id) VALUES ('cachorro orelhas lair', null, '01a2099d-0ebd-7584-b829-6efce93afa1b')")));
    
}
check()

//node --env-file ../.env .\testConnection.mjs