import {run_cmd} from "./run_cmd";


export function podList(): Promise<{content: string, error: string}> {
    return run_cmd("podman", ["ps"]);
}