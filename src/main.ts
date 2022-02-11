import {Logger} from "./Logger";
import {SKSQL, TAuthSession, WSRSQL} from "sksql";
import {dequeue} from "./Queue/dequeue";
const VERSION = "0.0.1";
import {WebSocket} from 'ws';


//@ts-ignore
global["WebSocket"] = WebSocket;

function start() {


    let db = new SKSQL();
    db.initWorkerPool(0, "");

    db.connectToDatabase("ws://localhost:30001", {
        connectionError(db: SKSQL, databaseHashId: string, error: string): any {
            Logger.instance.write("ERROR: " + error);
        },
        on(db: SKSQL, databaseHashId: string, message: string, payload: any) {
            console.log(message);
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


let l = new Logger(process.env.SKD_LOGPATH);
Logger.instance.write("SKDirector v" + VERSION);

start();