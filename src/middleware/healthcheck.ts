import * as Koa from "koa";
import { healthcheck } from "../graphqlApi/apiHealthcheck";

export async function healthcheckRequest(ctx: Koa.Context): Promise<void> {

    const { ok, msg } = await healthcheck();

    const body = {
        ok: (ok ? "ok" : "error"),
        ...msg,
        uptime: Math.floor(process.uptime()),
    };

    ctx.status = 200;
    ctx.set("Content-Type", "text/json");
    ctx.set("Cache-Control", "no-cache");
    ctx.body = JSON.stringify(body);
}
