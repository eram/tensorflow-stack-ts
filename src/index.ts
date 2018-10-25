import * as path from "path";
import * as fs from "fs";
import { isBuffer } from "util";
import * as Dotenv from "dotenv";
import dotevExpand from "dotenv-expand";
import * as App from "./app";
import { IndexSig } from "./utils";
import * as GqlApi from "./graphqlApi";
import * as Model from "./tensorFlowProvider";
import { setProcessHandelers } from "./processOn";
import { getAppGlobals } from "./appGlobals";
import { healthcheckRequest } from "./middleware/healthcheck";
import { graphqlMiddleware } from "./middleware/graphQL";


const appGlobals = getAppGlobals();

async function main(argv: string[]): Promise<number> {

    const env = process.env;
    setProcessHandelers(appGlobals);
    console.log("argv:", argv);

    if (!env.ROUTER_APP || !env.PORT) {

        // get config from environment: use "--resolve" to set the .env file
        console.log("loading env from .env", argv);
        let dotenv = Dotenv.config();
        if (dotenv.error) {
            console.warn(".env load failed. loading .debug.env");
            const fileName = path.resolve(process.cwd(), ".debug.env");
            dotenv = Dotenv.config({ path: fileName });
        }
        dotevExpand(dotenv);
    }

    if (!env.ROUTER_APP || !env.PORT) {
        console.error(`failed to load environment`);
        return 2;
    }

    console.log("env loded:", env);

    // get version from package.json
    const p = path.resolve(process.cwd(), "./package.json");
    try {
        const buf = fs.readFileSync(p);
        if (buf && isBuffer(buf)) {
            const pkg = JSON.parse(buf.toString()) as IndexSig;
            if (pkg && pkg.version) {
                appGlobals.version = String(pkg.version);
            }
        }
    } catch (e) {
        console.error(e);
        return 2;
    }

    appGlobals.prod = env.NODE_ENV === "production";
    console.log(`version: ${appGlobals.version} production: ${appGlobals.prod}`);

    // setup model
    const model = appGlobals.model = Model.getModelProvider();
    await model.init();
    const rc = await model.train(Model.defaultTrainData());
    if (!rc) {
        console.error(`failed to train model`);
        return 3;
    }

    await model.compile();
    if (model.getState() !== Model.State.compiled) {
        console.error(`failed to load model`);
        return 3;
    }

    // setup GraphQL API
    appGlobals.schema = GqlApi.initApi(model);

    // setup Koa
    const routes: App.IRoute[] = [
        {
            method: "get",
            path: env.ROUTER_HEALTHCHECK || "/_healthcheck",
            handler: healthcheckRequest,
        },
        {
            method: ["get", "post"],
            path: env.ROUTER_GRAPHQL || "/graphql",
            handler: graphqlMiddleware(appGlobals.schema, !appGlobals.prod || Boolean(process.env.ROUTER_SHOW_GRAPHIQL)),
        },
    ];

    if (env.ROUTER_CLIENT_FOLDER && fs.existsSync(env.ROUTER_CLIENT_FOLDER)) {
        routes.push({
            method: "static",
            path: env.ROUTER_CLIENT_PATH || "/app",
            folder: env.ROUTER_CLIENT_FOLDER,
        });
    }

    if (env.ROUTER_PUBLIC_FOLDER && fs.existsSync(env.ROUTER_PUBLIC_FOLDER)) {
        routes.push({
            method: "static",
            path: env.ROUTER_PUBLIC_PATH || "/",
            folder: env.ROUTER_PUBLIC_FOLDER,
        });
    }

    // go!
    const server = App.main(routes);
    appGlobals.server = server.listen(env.PORT);
    if (!appGlobals.server.listening) {
        console.error(`failed to start server on port ${env.PORT}`);
        return 3;
    }

    console.log(`Server started on http://${env.HOST}:${env.PORT}`);
    return 0;
}

/*
 * main application entry point
 */
main(process.argv).then((rc: number) => {
    if (rc) process.exit(rc);
}).catch((reason: number) => {
    process.exit(reason);
});
