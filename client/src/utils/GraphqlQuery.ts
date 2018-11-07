import { GraphQLClient } from "graphql-request";
import * as HttpStaus from "http-status-codes";

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

let theClient: ClientWrapper;
type getTokenFn = () => string;

export class ClientWrapper {

    // global instance
    static getGlobal(endpoint: string, getToken?: getTokenFn) {
        if (!theClient) theClient = new ClientWrapper(endpoint, getToken);
        return theClient;
    }

    // instance
    protected client: GraphQLClient;
    protected errStr = "";
    protected token = "-";

    constructor(public endpoint: string, public getToken = () => "") {
        /* */
    }

    public async request<VARS, RES>(query: string, vars?: VARS): Promise<RES> {

        try {
            this.errStr = "";
            const token = this.getToken();

            if (token !== this.token) {
                this.client = new GraphQLClient(this.endpoint, {
                    mode: "cors",
                    credentials: !!token ? "include" : "omit",
                    // tslint:disable-next-line:object-literal-key-quotes
                    headers: !!token ? { "Authorization": "Bearer " + token } : {},
                });
                this.token = token;
            }

            const { data, errors, status } = await this.client.rawRequest<RES>(query, vars);

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
