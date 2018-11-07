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
import { getAuthMiddleware } from "./middleware/jsonWebToken";


export interface IRoute {
    method: "get" | "post" | Array<"get" | "post"> | "static";
    path: string;               /* path under the router's main entry */
    auth: boolean;              /* require authentication */
    handler?: Koa.Middleware;   /* for get|post */
    folder?: string;            /* for static */
}

export { appendError };

export function main(routes: IRoute[]): Koa {

    const app: Koa = new Koa();
    const router = joiRouter();
    const mounts: Koa.Middleware[] = [];
    const routerAuth = joiRouter();
    const mountsAuth: Koa.Middleware[] = [];
    const appGlobals = getAppGlobals();
    const excluded = Array<string>();

    const prefix = process.env.ROUTER_APP || "/";
    router.prefix(prefix);
    routerAuth.prefix(prefix);

    console.log("Router setup:", `  prefix: ${prefix}`);
    routes.forEach((route: IRoute) => {

        if (route.method === "static") {
            if (!route.folder) throw new Error("missing route.folder");
            const srv = serve(route.folder, { defer: false, gzip: false });
            const mnt = mount(route.path, srv);
            console.log(`  ${route.path} => ${route.folder}  auth=${route.auth}`);
            if (route.auth) {
                mountsAuth.push(mnt);
            } else {
                mounts.push(mnt);
            }
        } else {
            if (!route.handler) throw new Error("missing route.handler");
            const name = (typeof route.handler === "function") ? route.handler.name : "func?";
            console.log(`  ${route.path} => ${name}  auth=${route.auth}`);
            if (route.auth) {
                routerAuth.route(route as any /*joiRouter.Spec*/); // tslint:disable-line:no-any
            } else {
                router.route(route as any /*joiRouter.Spec*/); // tslint:disable-line:no-any
                // routerAuth.route(route as any /*joiRouter.Spec*/); // tslint:disable-line:no-any
                // excluded.push(`${prefix}${route.path}`);
            }
        }
    });

    // set app midleware
    app.use(errorChainHandler);

    if (!appGlobals.debugging) {
        // no point to alert on long requests when debgging
        app.use(responseTimeHandler);
    }

    if (appGlobals.prod) {
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
        .use(cors({ credentials: true, maxAge: (60 * 60) }))
        .use(bodyParser());

    // unauthenticated here
    app.use(router.middleware());
    mounts.forEach((mnt) => app.use(mnt));

    // authenticate here
    app.use(getAuthMiddleware(excluded));
    app.use(routerAuth.middleware());
    mountsAuth.forEach((mnt) => app.use(mnt));

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
