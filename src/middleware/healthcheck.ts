import * as Koa from "koa";
import { healthcheck } from "../graphqlApi/apiHealthcheck";
import { getAppGlobals } from "../appGlobals";

const stats = getAppGlobals().stats;

export async function healthcheckRequest(ctx: Koa.Context): Promise<void> {

    const { ok, msg } = await healthcheck();

    ctx.status = 200;
    ctx.set("Cache-Control", "no-cache");
    ctx.type = "json";
    ctx.body = {
        ok: (ok ? true : false),
        ...msg,
        stats,
        uptime: Math.round(process.uptime()),
        heap: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    };
}
