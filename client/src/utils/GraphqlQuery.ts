import { GraphQLClient } from "graphql-request";
import * as HttpStaus from "http-status-codes";
import { IndexSig } from ".";


/**
 * Usage example:
 *
 * const endpoint = "https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr";
 *
 * const query = `
 * query getMovie($title: String!) {
 *    Movie(title: $title) {
 *      releaseDate
 *      actors {
 *        name
 *      }
 *    }
 *  }`
 *
 * interface IVars {
 *   title: string,
 * }
 *
 * interface IResp {
 *      Movie: {
 *          releaseDate: string,
 *          actors: { name: string }[];
 *      }
 * }
 *
 */

let client: ClientWrapper;

export class ClientWrapper extends GraphQLClient {

    // static
    static getGlobal(endpoint: string, token?: string) {
        if (!client) client = new ClientWrapper(endpoint, token);
        return client;
    }

    /* merge the vars into the query - the wat it is done by QraphQL:
     *
     * mergeVars("q(in: $p1)", {p1:1}) => "q(in: 1)"
     *
     */
    static mergeVars(query: string, varsObj: IndexSig): string {
        let key: string;
        for (key in varsObj) {
            if (key) {

                // TODO?? sterile regex input
                const re = `\\\$${key}`; // .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
                query = query.replace(new RegExp(re, "g"), varsObj[key]);
            }
        }

        return query;
    }

    // instance
    protected errStr = "";

    constructor(endpoint: string, token?: string) {

        // token = token || "MY_TOKEN";
        super(endpoint, {
            credentials: token ? "include" : "omit",
            mode: "cors",
            headers: token ? { authorization: `Bearer ${token}` } : {},
        });
    }

    public async request<VARS, RES>(query: string, vars?: VARS): Promise<RES> {

        try {
            this.errStr = "";

            const { data, errors, status } = await this.rawRequest<RES>(query, vars);

            if (errors) {
                this.errStr = errors[0].message;
            }

            if (status === HttpStaus.OK && data) {
                return data;
            } else {
                this.errStr = `Error in GraphQL response: status=${status} data=${data}`;
            }

        } catch (e) {
            this.errStr = (e && e.message) ? e.message : "Unknown exception";
        }

        // tslint:disable-next-line:no-any
        return undefined as any;
    }

    getErr() { return this.errStr; }


}
