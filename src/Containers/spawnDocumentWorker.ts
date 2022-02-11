
import {exec_cmd, run_cmd} from "../run_cmd";
import * as path from "path";
import * as fs from "fs";
import {getContainersList} from "./getContainersList";


function runSerial(tasks: (() => Promise<void>)[]) {
    var result = Promise.resolve();
    tasks.forEach((task) => {
        result = result.then(task);
    });
    return result;
}

export function spawnDocumentWorker(worker_id: number,
                                    account_id: number,
                                    database_id: number,
                                    encryptionKey: string,
                                    port: number,
                                    alive: number): Promise<boolean> {
    let worker_name = "SKServer_" + account_id.toString() + "_" + database_id.toString() + "_" + port.toString();
    console.log(worker_name);
    const dbPath = path.normalize(process.env.SKD_DBVAULT + "/" + account_id.toString() + "/" + database_id.toString());
    return new Promise<boolean>( (resolveSpawn, rejectSpawn) => {
        runSerial(
            [
                () => {
                    return new Promise<void>((resolve, reject) => {
                        run_cmd("whoami", []).then((c) => {
                            console.log("I am " + c.content);
                            resolve();
                        }).catch(() => {
                            console.log("I don't know who I am.")
                            reject();
                        })
                    })
                },
                // does the document exists
                () => {
                    return new Promise<void>((resolve, reject) => {
                        if (!fs.existsSync(dbPath)) {
                            fs.mkdirSync(dbPath);
                            resolve();
                        } else {
                            resolve();
                        }
                    })
                },
                // does the worker already exists
                () => {
                    return new Promise<void>((resolve, reject) => {
                        getContainersList().then((c) => {
                            let list = JSON.parse(c.content);
                            let exists = list.find((l) => {
                                return l.Names.includes(worker_name);
                            });
                            if (exists !== undefined) {
                                return resolve();
                            }

                            let execParams =
                                "podman " +
                                "run " +
                                "--detach " +
                                "--tty=true " +
                                "--rm=true " +
                                "--network=\"host\" " +
                                `--name=${worker_name} ` +
                                `--volume=${dbPath}:/data ` +
                                "--env " + `SKWORKER_ID=${worker_id} ` +
                                "--env " + `SKDB_PATH=/data` +
                                "--env " + `SKWORKER_ALIVE=${alive} ` +
                                "--env " + `SKWORKER_PORT=${port}` +
                                "skeletapp/SKServer:latest " +
                                //"/bin/bash";
                                "node build/main.js";
                            exec_cmd(execParams).then((content) => {
                                console.log(content.content);
                                resolve();
                            }).catch(() => {
                                reject();
                            })
                        }).catch(() => {
                            reject();
                        });
                    });
                }
            ]
        ).then(() => {
            resolveSpawn(true);
        }).catch(() => {
            rejectSpawn({});
        });
    });
}