import { ModelProviderBase } from "./modelProviderBase";
import { GraphQLSchema } from "graphql";
import * as Http from "http";


function isDebug() {
    const argv = process.execArgv.join();
    return (argv.includes("inspect") || argv.includes("debug"));
}

export class AppGlobals {
    public version = "unknown";     // to be read from package.json.version
    public prod = true;             // production env by default!
    public isDebug = isDebug();
    public stats = {
        apis: 0,
        messages: 0,
        errors: 0,
        reloads: 0,
    };
    public model?: ModelProviderBase;
    public schema?: GraphQLSchema;
    public server?: Http.Server;
}

const g = new AppGlobals();

export function getAppGlobals() {
    return g;
}
