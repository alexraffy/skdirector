import {SQLStatement, SKSQL, SQLResult, readTableAsJSON} from "sksql";
import {Logger} from "../Logger";
import {spawnDocumentWorker} from "../Containers/spawnDocumentWorker";
import {getContainersList} from "../Containers/getContainersList";


export function dequeue(db: SKSQL) {
    Logger.instance.write("dequeue");

    let sql = "Execute usp_dequeue;";
    let st = new SQLStatement(db, sql);
    let ret = st.run() as SQLResult;
    if (ret.error !== undefined) {
        Logger.instance.write(ret.error);
        return;
    }
    let data = readTableAsJSON(db, ret.resultTableName);
    st.close();
    if (data.length === 0) {
        Logger.instance.write("nada.");
        return;
    }

    if (data.length > 0 && data[0].account_id !== undefined) {
        let worker_name = "SKServer_" + data[0].account_id.toString() + "_" + data[0].database_id.toString() + "_" + data[0].toString();

        spawnDocumentWorker(data[0].worker_id, data[0].account_id, data[0].database_id, data[0].encryptionKey, data[0].port, 36000).then((v) => {
            if (v === true) {
                let up = new SQLStatement(db, "Exec usp_ack @requestGuid = @requestGuid;");
                up.setParameter("@requestGuid", data[0].requestGuid);
                let retUp = up.run() as SQLResult;
                if (retUp.error !== undefined) {
                    Logger.instance.write(retUp.error);
                }
                up.close();
                dequeue(db);
            }
        }).catch((e) => {
            getContainersList().then((c) => {
                let list = JSON.parse(c.content);
                let exists = list.find((l) => {
                    return l.Names.includes(worker_name);
                });
                if (exists !== undefined) {
                    let up = new SQLStatement(db, "Exec usp_ack @requestGuid = @requestGuid;");
                    up.setParameter("@requestGuid", data[0].requestGuid);
                    let retUp = up.run() as SQLResult;
                    if (retUp.error !== undefined) {
                        Logger.instance.write(retUp.error);
                    }
                    up.close();
                }
                dequeue(db);
            }).catch((egcl) => {
                Logger.instance.write("Error getContainersList: ", egcl.message);
                dequeue(db);
            })

        });
    }


}