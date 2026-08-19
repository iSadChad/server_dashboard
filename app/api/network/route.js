export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);


async function runCommand(command, args = [], timeout = 5000) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout,
      maxBuffer: 1024 * 1024,
    });

    return {
      ok: true,
      stdout: stdout || "",
      stderr: stderr || "",
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      error: error.message,
    };
  }
}


function parseTailscaleStatus(stdout) {
    const obj = JSON.parse(stdout);

    return {
       BackendState: obj.BackendState,
       Self: obj.Self,
       Peer: obj.Peer
    };

}




export async function GET() {
    try {
        const tailscaleResult = await runCommand("tailscale", ["status", "--json"], 5000);

        if(!tailscaleResult.ok) {
            throw new Error(tailscaleResult.error);
        }

        const tailscaleStatus = parseTailscaleStatus(tailscaleResult.stdout); 
        let networkStatus = "unknown";

          if(tailscaleStatus.BackendState === "Running") {
            networkStatus = "connected";
        } else if (tailscaleStatus.BackendState === "Stopped") {
            networkStatus = "disconnected";
        } 

        return Response.json({
        status: "ok", 
        networkStatus,
        tailscale: tailscaleStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
    console.error("Failed to load network status:", error);


    return Response.json({
        status: "error",
        message: "Could not load network status",
        details: error.message,
        updatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
    
  }

}
