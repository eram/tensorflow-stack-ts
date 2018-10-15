import * as Koa from "koa";
import { healthcheck } from "../graphqlApi/apiHealthcheck";

export
async function healthcheckRequest(ctx: Koa.Context): Promise<void> {

    const {ok, msg} = await healthcheck();

    ctx.status = 200;
    ctx.set("Content-Type", "text/json");
    ctx.body = `{status: \"${ok ? "ok" : "error"}\", msg: \"${msg}\" uptime: ${Math.floor(process.uptime())}}`;
}
