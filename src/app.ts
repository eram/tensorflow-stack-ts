import Koa from "koa";
import serve from "koa-static";
import mount from "koa-mount";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import joiRouter from "koa-joi-router";
import compress from "koa-compress";
// tslint:disable-next-line:no-require-imports no-var-requires
const userAgent = require("koa-useragent") as Koa.Middleware;
import { responseTimeHandler } from "./middleware/responseTime";
import { errorChainHandler, appendError, appOnError } from "./middleware/errorChain";
import { getAppGlobals } from "./appGlobals";


export interface IRoute {
    method: "get" | "post" | Array<"get" | "post"> | "static";
    path: string;
    handler?: Koa.Middleware;   /* get|post */
    folder?: string;            /* static */
}

export { appendError };

export function main(routes: IRoute[]): Koa {

    const app: Koa = new Koa();
    const router = joiRouter();

    const prefix = process.env.ROUTER_APP || "/";
    router.prefix(prefix);

    console.log("Router setup:", `  prefix: ${prefix}`);
    routes.forEach((route: IRoute) => {

        if (route.method === "static") {
            if (!route.folder) throw new Error("missing route.folder");
            const srv = serve(route.folder, { defer: false, gzip: false });
            const mnt = mount(route.path, srv);
            app.use(mnt);
            console.log(`  ${route.path} => ${route.folder}`);
        } else {
            if (!route.handler) throw new Error("missing route.handler");
            // tslint:disable-next-line:no-any
            router.route(route as any /*joiRouter.Spec*/);
            let name = "func?";
            if (route.handler && route.handler instanceof Array && typeof route.handler[0] === "function") {
                name = route.handler[0].name;
            }
            console.log(`  ${route.path} => ${name}`);
        }
    });

    // set app midleware
    app.use(errorChainHandler)
        .use(responseTimeHandler)
        .use(cors());

    if (getAppGlobals().prod) {
        app.use(compress());
    }

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

    app.on("error", appOnError);
    return app;
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
