import {run_cmd} from "../run_cmd";


export function getContainersList(): Promise<{content: string, error: string}> {
    return run_cmd("podman", ["container", "list" ,"--all" ,"--format=json"]);
}