import Koa from "koa";
import { IndexSig } from "../utils";
import { GraphQLSchema } from "graphql/type/schema";
// tslint:disable-next-line:no-require-imports no-unsafe-any no-var-requires
const graphqlHTTP: (options: IndexSig) => Koa.Middleware = require("koa-graphql");

export function graphqlMiddleware(schema: GraphQLSchema, graphiql: boolean): Koa.Middleware {
    return graphqlHTTP({ schema, graphiql });
}
