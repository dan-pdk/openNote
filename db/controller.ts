import { Pool } from 'pg';
const env = process.env


const pool = new Pool({
    host: "localhost",
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: 5432,
    idleTimeoutMillis: 30000
})

type queryCommand = {
    insert: Function,
    values: Function,
    resolve: Function,

    query: string
}

function createQueryCommand() : queryCommand {
    const queryCommand = {} as queryCommand;
    queryCommand.query = ""

    function insert(table: string) {
        queryCommand.query += `INSERT INTO ${table} `;
        return queryCommand;
    }
    queryCommand.insert = insert

    function values(valuesData: Record<string, any>) {
        const keys = Object.keys(valuesData);
        const dataValues = Object.values(valuesData);


        let keysAsQuery = "(";
        keys.forEach((key: string, index: number) => {
            const isLastKey = index == keys.length - 1;
            if (isLastKey) {
                keysAsQuery += key;
            } else {
                keysAsQuery += `${key}, `;
            }
        })
        keysAsQuery += ")";

        let valuesAsQuery = "VALUES (";
        dataValues.forEach((value: string | number, index: number) => {
            const isLastKey = index == keys.length - 1;
            if (typeof value === "string") {
                if (isLastKey) {
                    valuesAsQuery += `'${value}'`;
                } else {
                    valuesAsQuery += `'${value}', `;
                }
            } else {
                if (isLastKey) {
                    valuesAsQuery += value;
                } else {
                    valuesAsQuery += `${value}, `;
                }
            }
        })
        valuesAsQuery += ")";

        queryCommand.query += `${keysAsQuery} ${valuesAsQuery}`
        return queryCommand;
    }
    queryCommand.values = values

    function resolve() {
        queryCommand.query += ";";
        return queryCommand.query;
    }
    queryCommand.resolve = resolve

    return queryCommand
}


type controller = {
    createQueryCommand: Function,
    runQuery: Function
}

function createController() {
    const controller = {} as controller;

    controller.createQueryCommand = createQueryCommand;

    async function runQuery(query: string, values?: Array<any>) {
        const { rows } = values ? await pool.query(query, values) : await pool.query(query)
        return rows;
    }
    controller.runQuery = runQuery;

    return controller
}

const controller = createController();

export default controller;

