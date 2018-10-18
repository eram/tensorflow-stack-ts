
import { GraphQLSchema, GraphQLError } from "graphql";
import { getAppGlobals } from "../appGlobals";
import * as Model from "../modelProviderBase";

// tslint:disable-next-line:interface-name
interface ExecutionResult<T> {
    errors?: ReadonlyArray<GraphQLError>;
    data?: T;
}

type graphqlType = <T>(schema: GraphQLSchema, query: string) => Promise<ExecutionResult<T>>;
// tslint:disable-next-line:no-require-imports no-var-requires no-unsafe-any
const graphqlFn: graphqlType = require("graphql").graphql;

interface IgetType {
    getState: number;
    getName: string;
}

const appGlobals = getAppGlobals();

export async function healthcheck(): Promise<{ ok: boolean, msg: string }> {
    const rc = { ok: false, msg: "GraphQL API error" };

    if (appGlobals.schema) {

        const response = await graphqlFn<IgetType>(appGlobals.schema!, "{ getState getName }");

        if (!!response && response.errors) {
                rc.msg = response.errors[0].message ;

        } else if (!!response && response.data && typeof response.data.getState === "number"
        && typeof response.data.getName === "string") {

            rc.ok = response.data.getState !== Model.State.error ;
            rc.msg = `provider=${response.data.getName} state=${Model.State[response.data.getState]}`;
        }
    }

    return rc;
}
