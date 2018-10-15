import Koa from "koa";
import { appendError } from "../app";

const maxRespTime = process.env.ROUTER_MAX_RESPONSE_TIME || 100;

export async function responseTimeHandler(ctx: Koa.Context, next: () => Promise<void>) {

    // measure response time
    const start = Date.now();

    await next();

    const ms = Date.now() - start;
    if (ms > maxRespTime) {
        appendError(ctx, `Long response time ${ms}ms: ${ctx.href}`);
        ctx.set("X-Response-Time", `${ms}ms`);
    }
}
