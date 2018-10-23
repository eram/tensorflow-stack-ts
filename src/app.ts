import * as path from "path";
import Koa from "koa";
import serve from "koa-static";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import joiRouter from "koa-joi-router";
import compress from "koa-compress";
// tslint:disable-next-line:no-require-imports no-var-requires
const userAgent = require("koa-useragent") as Koa.Middleware;
import { responseTimeHandler } from "./middleware/responseTime";
import { errorChainHandler, appendError, onCtxError } from "./middleware/errorChain";
import { getAppGlobals } from "./appGlobals";

export type RouterHandler = (ctx: Koa.Context, next?: () => Promise<void>) => Promise<void>;

export interface IRoute {
    method: "get" | "post" | Array<"get" | "post">;
    path: string;
    handler: RouterHandler;
}

export { appendError };

export function main(routes: IRoute[]): Koa {

    const app: Koa = new Koa();
    const router = joiRouter();

    const prefix = process.env.ROUTER_APP || "/";
    // routes.forEach((route: IRoute) => {
    //    route.path = path.join(prefix, route.path).replace(/[\\,//]/g, "/");
    // });
    router.prefix(prefix);
    router.route(routes as joiRouter.Spec[]);

    // set app midleware
    app.use(errorChainHandler)
        .use(responseTimeHandler)
        .use(cors());

    if (getAppGlobals().prod) {
        app.use(compress());
    }

    // serve static site
    let p = process.env.ROUTER_STATIC_FOLDER || "";
    p = (p.indexOf("\\") > 0 || p.indexOf("/") > 0) ? p : path.join(process.cwd(), "/", p);
    app.use(serve(p, { defer: false, gzip: true }));
    console.log(`static site: / => ${p}`);

    /* TODO
    app.use(koaBunyanLogger(log))
        .use(koaBunyanLogger.timeContext())
        .use(koaBunyanLogger.requestIdContext())
        .use(koaBunyanLogger.requestLogger({
            updateRequestLogFields: logger.requestSerializer(),
            updateResponseLogFields: logger.responseSerializer()
        }));
    */

    app.use(userAgent) // addes ctx.userAgent
        // app.use(authorizeSecret);
        // app.use(koaJwt(restApp.koaJWTOptions).unless({ path: [/^\/favicon.ico/] }))
        .use(bodyParser())
        .use(router.middleware());

    // Error catching - override koa's undocumented error handler
    app.context.onerror = onCtxError;
    app.on("error", appOnError);

    printRoutes(router, prefix);
    return app;
}

// koa.onError function
function appOnError(err: Error, ctx?: Koa.Context): void {

    // ctx exists if this is error inside a request context
    const errorDetails = {
        status: ctx ? ctx.status : 0,
        url: (ctx && ctx.request !== undefined) ? ctx.request.url : "",
        error: err.message,
        stack: err.stack,
        err,
    };

    if (ctx) {
        appendError(ctx, JSON.stringify(errorDetails, null, 2));
    } else {
        console.warn("Koa app.onError:", errorDetails);
    }
}

/**
 * Prints out info about configured endpoints in a router.
 * @param router a router for which to print out all setup routes
 * @param prefix optional, a message to show before printing all routes
 */
function printRoutes(router: joiRouter.Router, prefix?: string) {

    const output: string[] = [];
    router.routes.map((spec: joiRouter.Spec) => {
        let name = "";
        if ( spec && spec.handler && spec.handler instanceof Array && spec.handler[0].prototype) {
            name = spec.handler[0].name;
        }
        output.push(`${name}: ${spec.path} validation: ${spec.validate ? "exists" : "none"}`);
    });
    console.log("Router setup:\n", `prefix: ${prefix}`, output);
}

/*

// Security headers
app.use(koaHelmet());
app.use(koaHelmet.contentSecurityPolicy({ directives: { defaultSrc: ["'self'"] } }));
app.use(koaHelmet.frameguard('deny'));
app.use(koaCors({
    credentials: true,
    exposeHeaders: [
        'Authorization',
        'Content-Disposition',
        'Content-Type',
        'X-Entities',
    ],
    allowHeaders: [
        'Authorization',
        'Content-Disposition',
        'Content-Type',
        'X-Entities',
    ],
    allowMethods: [
        'DELETE',
        'GET',
        'POST',
        'PUT',
    ],
    origin: (ctx) => {
        const origin = ctx.get('origin');

        if (!!origin.length && config.apps.api.allowedOrigins.indexOf(origin) === -1) {
            return false;
        }

        return origin;
    },
}));


// DB connection
app.use(connectToDbMiddleware(pool.connect, appLogger, config.apps.api.db));

if (env !== 'development') {
    // gzip compression
    app.use(compress());
}

....

app.use(koaBodyParser());

app.use(koaMount('/api', api));
app.use(koaMount('/admin', admin));

*/
