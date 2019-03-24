import * as Koa from "koa";
import serve from "koa-static";

// thin wrapper around koa-static
export function serveStatic(folder: string, opts?: serve.Options): Koa.Middleware {

    const opts2 = { ...opts, defer: false, gzip: false };
    const srv = serve(folder, opts2);
    Object.defineProperty(srv, "name", { value: `serve: ${folder}` });
    return srv;
}
