import { ModelProviderBase } from "./modelProviderBase";
import { GraphQLSchema } from "graphql";
import * as Http from "http";


export class AppGlobals {
    public version = "unknown"; // to be read from package.json.version
    public dev = true;
    public stats = {
        messages: 0,
        exceptions: 0,
        reloads: 0,
    };
    public model?: ModelProviderBase;
    public schema?: GraphQLSchema;
    public server?: Http.Server;
}
