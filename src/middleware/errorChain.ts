import Koa from "koa";
import { IndexSig } from "src/utils";
import HttpErrors from "http-errors";
import { getAppGlobals } from "../appGlobals";

const appGlobals = getAppGlobals();

// error chain is used by deeper levels of the app to send errors found up the chain.
// we also handle here context errors and koa app errors

export async function errorChainHandler(ctx: Koa.Context, next: () => Promise<void>) {

    const state = ctx.state as IndexSig;
    state.errorChain = [];

    await next().catch((err: HttpErrors.HttpError) => {

        appGlobals.stats.errors++;

        ctx.status = err.statusCode || err.status || 500;
        ctx.type = "json";
        if (!ctx.message.length) {
            ctx.message = err.message;
        }

        ctx.body = {
            error: (err.message) ? err.message : "Internal server error",
        };

        // on dev send the stack to the client
        if (!appGlobals.prod && err.stack) {
            ctx.body = {
                ...ctx.body,
                code: err.code,
                stack: err.stack,
            };
        }

        ctx.state.errorChain.push(`${ctx.href} ${ctx.status}: ${err.stack}`);
    });

    if (ctx.status >= 400 && !state.errorChain.length) {
        state.errorChain.push(`${ctx.href} ${ctx.status}: ${JSON.stringify(ctx.body, null, 2)}`);
    }

    if (state.errorChain.length) {
        let msg = "", errors = 0;
        state.errorChain.forEach((str: string) => { msg += `${errors++}: \"${str}\",\n`; });
        console.error(`errorChain: [\n${msg}   ]`);
    }
}

export function appendError(ctx: Koa.Context, err: string): void {

    const state = ctx.state as IndexSig;
    if (state && state.errorChain) {
        state.errorChain.push(err);
    }
}

// koa.onError function
export function appOnError(err: Error, ctx?: Koa.Context): void {

    console.warn("Koa app.onError:", err);
    appGlobals.stats.errors++;

    // ctx exists if this is error inside a request context
    if (ctx) {
        const details = {
            url: (ctx.request) ? ctx.request.url : "",
            status: ctx.status,
            ...err,
        };
        appendError(ctx, JSON.stringify(details, null, 2));
    }
}
