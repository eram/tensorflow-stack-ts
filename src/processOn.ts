import { AppGlobals } from "./appGlobals";

export function setProcessHandelers(g: AppGlobals): void {

    process.on("SIGINT", () => {
        console.log(`Recieved signal SIGINT`);
        if (g.server) g.server.close();
        setTimeout(() => { process.exit(1); }, 500);
    });

    process.on("SIGTERM", () => {
        console.log(`Recieved TERM`);
        if (g.server) g.server.close();
        setTimeout(() => { process.exit(1); }, 500);
    });

    process.on("SIGHUP", () => {
        console.log(`Recieved SIGHUP`);
        // TODO: reload config
        g.stats.reloads++;
    });

    process.on("exit", (code: number) => {
        console.log(`About to exit with code: ${code}`);
    });

    process.on("message", (msg) => {
        // message for pm2
        console.log(`Recieved message ${msg}`);
        g.stats.messages++;
    });

    process.on("uncaughtException", (err: Error) => {
        console.error(err);
        g.stats.exceptions++;
        process.exit(1);
    });

    process.on("unhandledRejection", (err: Error) => {
        console.error(err);
        g.stats.exceptions++;
        throw err;
    });

    function sigHandler(signal: string) {
        console.log(`Recieved ${signal}`);
    }

    // standard handler for some other signals
    // SIGUSR1 is debugger attached << do not override it!
    ["SIGUSR2", "SIGVTALRM", "SIGBREAK", "SIGLOST", "SIGINFO"].forEach( (sig) => {
        // tslint:disable-next-line:no-any
        process.on(sig as any, sigHandler);
    });
}
