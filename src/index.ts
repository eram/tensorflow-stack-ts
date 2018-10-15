import * as path from "path";
import * as fs from "fs";
import { isBuffer } from "util";
import * as Dotenv from "dotenv";
import dotevExpand from "dotenv-expand";
import * as App from "./app";
import { healthcheckRequest } from "./middleware/healthchek";
import { IndexSig } from "./utils";
import * as GqlApi from "./graphqlApi";
import * as Model from "./tensorFlowProvider";
import { setProcessHandelers } from "./processOn";
import { AppGlobals } from "./appGlobals";


// tslint:disable-next-line:no-require-imports no-unsafe-any no-var-requires
const graphqlHTTP: (options: IndexSig) => App.RouterHandler = require("koa-graphql");


// application globals
export const appGlobals = new AppGlobals();

async function main(argv: string[]): Promise<number> {

    setProcessHandelers(appGlobals);
    console.log("argv:", argv);

    // get config from environment: use "--resolve" to set the .env file
    let env = Dotenv.config();
    if (env.error) {
        console.warn(".env file failed to load. using default .debug.env");
        const fileName = path.resolve(process.cwd(), "./.debug.env");
        env = Dotenv.config({ path: fileName });
    }

    if (env.error || !process.env.ROUTER_APP || !process.env.SRV_PORT) {
        console.error(`failed to load environment`);
        return 2;
    }

    dotevExpand(env);
    console.log("env loded:", process.env);

    // get version from package.conf
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

    appGlobals.dev = process.env.NODE_ENV !== "production";
    console.log(`version: ${appGlobals.version} production: ${!appGlobals.dev}`);

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
    const schema = appGlobals.schema = GqlApi.initApi(model);

    // setup Koa
    const routes: App.IRoute[] = [
        {
            method: "get",
            path: process.env.ROUTER_HEALTHCHECK || "/_healthcheck",
            handler: healthcheckRequest,
        },
        {
            method: ["get", "post"],
            path: process.env.ROUTER_GRAPHQL || "/graphql",
            handler: graphqlHTTP({
                schema,
                graphiql: appGlobals.dev,
            }),
        },
    ];

    // go!
    const server = App.main(routes);
    appGlobals.server = server.listen(process.env.SRV_PORT);
    if (!appGlobals.server.listening) {
        console.error(`failed to start server on port ${process.env.SRV_PORT}`);
        return 3;
    }

    console.log(`Server started on port ${process.env.SRV_PORT}`);
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
