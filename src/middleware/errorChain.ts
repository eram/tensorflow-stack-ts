import Koa from "koa";
import { IndexSig } from "src/utils";
import HttpErrors from "http-errors";
import { getAppGlobals } from "../appGlobals";

const appGlobals = getAppGlobals();

export async function errorChainHandler(ctx: Koa.Context, next: () => Promise<void>) {

    // error chain is used by deeper levels of the app to send up the chain errors found.
    const errorChain: string[] = [];
    (ctx.state as IndexSig).errorChain = errorChain;

    await next().catch((err: Error) => {
        console.error("Koa: Exception caught in exception middleware", { err });
        if (err instanceof HttpErrors.HttpError) {
            ctx.status = err.statusCode || err.status || 500;
            ctx.set("Content-Type", "text/json");
            ctx.body = { message: err.message };
        } else {
            ctx.status = 500;
            ctx.set("Content-Type", "text/json");
            ctx.body = { message: "Internal server error" };

            // re-throw the error >> will be caught in app.onError
            const err2 = new Error(err.message);
            err2.stack = err.stack;
            throw err2;
        }

        errorChain.push(`${ctx.href} exeption in middleware:${err.message} `);
    });

    if (ctx.status !== 200) {
        errorChain.push(`${ctx.href} ${ctx.status}:${ctx.message}`);
    }

    if (errorChain.length) {
        let msg = "", errors = 0;
        errorChain.forEach((str) => { msg += `${errors++}: \"${str}\",\n`; });
        console.error(`errorChain: [\n${msg}]`);
    }
}

export function appendError(ctx: Koa.Context, err: string): void {

    const errorChain = ctx ? ctx.state ? ((ctx.state as IndexSig).errorChain as string[]) : [] : [];
    errorChain.push(err);
}


// Error catching - override koa's undocumented error handler
export function onCtxError(this: Koa.Context, err: HttpErrors.HttpError) {
    if (!err) return;

    this.status = err.status || 500;
    this.app.emit("error", err, this);

    if (this.headerSent || !this.writable) {
        err.headerSent = true; // eslint-disable-line no-param-reassign
        return;
    }

    // on dev we respond with the full error details
    if (!appGlobals.prod) {
        this.body = JSON.stringify({
            error: err.message,
            stack: err.stack,
            code: err.code,
        });
        this.type = "json";
    } else {
        // just send the error message
        this.body = err.message;
    }

    this.res.end(this.body);
}

