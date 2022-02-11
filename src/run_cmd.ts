import * as spawn from "cross-spawn";
import {exec} from "child_process";

function resolveRun(exitCode, stdout, stderr) {
    stdout = stdout && stdout.toString();
    stderr = stderr && stderr.toString();

    if (exitCode !== 0) {
        return Object.assign(new Error(`Command failed, exited with code #${exitCode}`), {
            exitCode,
            stdout,
            stderr,
        });
    }

    return {
        stdout,
        stderr,
    };
}

export function exec_cmd(execstr: string): Promise<{content: string; error: string}> {
    return new Promise<{content: string; error: string}>( (resolve, reject) => {
        exec(execstr, (error, stdout, stderr) => {
            if (error) {
                return resolve({error: error.message, content: ""});
            }
            resolve({content: stdout, error: stderr});
        });
    });
}


export function run_cmd(exec: string, args: string[]): Promise<{content: string; error: string}> {
    const child = spawn(exec, args, { stdio: "pipe" });
    let promise = new Promise<{content: string; error: string}>( (resolve, reject) => {
        let stdout = null;
        let stderr = null;

        child.stdout && child.stdout.on('data', (data) => {
            stdout = stdout || new Buffer('');
            stdout = Buffer.concat([stdout, data]);
        });

        child.stderr && child.stderr.on('data', (data) => {
            stderr = stderr || new Buffer('');
            stderr = Buffer.concat([stderr, data]);
        });

        const cleanupListeners = () => {
            child.removeListener('error', onError);
            child.removeListener('close', onClose);
        };

        const onError = (err) => {
            cleanupListeners();
            reject(err);
        };

        const onClose = (code) => {
            cleanupListeners();

            const resolved = resolveRun(code, stdout, stderr);

            if (resolved instanceof Error) {
                reject(resolved);
            } else {
                resolve({content: resolved.stdout, error: resolved.stderr});
            }
        };

        child
            .on('error', onError)
            .on('close', onClose);
    });



    return promise;
}