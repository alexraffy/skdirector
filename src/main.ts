import {Logger} from "./Logger";
import {SKSQL, TAuthSession, WSRSQL} from "sksql";
import {dequeue} from "./Queue/dequeue";
const VERSION = "0.0.1";
import {WebSocket} from 'ws';


//@ts-ignore
global["WebSocket"] = WebSocket;

function usage() {
    console.log("Usage: node build/main.js --log=path --vault=path");
}

global["DBVault"] = "";

function start() {

    let params = process.argv;
    let logPath = undefined;
    let vaultPath = undefined;
    for (let i = 0; i < params.length; i++) {
        if (params[i].startsWith("--log=")) {
            logPath = params[i].replace("--log=", "");
            if (logPath.length > 0) {
                if (logPath[0] === '"' || logPath[0] === "'") {
                    logPath = logPath.substr(1, logPath.length - 2);
                }
            }
        }
        if (params[i].startsWith("--vault=")) {
            vaultPath = params[i].replace("--vault=", "");
            if (vaultPath.length > 0) {
                if (vaultPath[0] === '"' || vaultPath[0] === "'") {
                    vaultPath = vaultPath.substr(1, vaultPath.length - 2);
                }
            }
        }
    }
    if (logPath === undefined || logPath === "" || vaultPath === undefined || vaultPath === "") {
        usage();
        process.exit(0);
    }
    let l = new Logger(logPath);
    Logger.instance.write("SKDirector v" + VERSION);
    Logger.instance.write("Log: ", logPath);
    Logger.instance.write("Vault: ", vaultPath);
    global["DBVault"] = vaultPath;

    let db = new SKSQL();
    db.initWorkerPool(0, "");

    db.connectToDatabase("ws://localhost:30001", {
        connectionError(db: SKSQL, databaseHashId: string, error: string): any {
            Logger.instance.write("ERROR: " + error);
        },
        on(db: SKSQL, databaseHashId: string, message: string, payload: any) {
            //console.log(message);
            if (message === WSRSQL) {
                dequeue(db);
            }
        },
        connectionLost(db: SKSQL, databaseHashId: string) {


        },
        authRequired(db: SKSQL, databaseHashId: string): TAuthSession {
            return {name: "SKDirector", id: 1, token: "", valid: true} as TAuthSession
        },
        ready(db: SKSQL, databaseHashId: string): any {
            dequeue(db);
        }
    });

}




start();