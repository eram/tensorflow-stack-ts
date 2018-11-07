import * as Koa from "koa";
import fetch from "node-fetch";
import { appendError } from "../app";
import { URL } from "url";
import { generateJwt } from "./jsonWebToken";
import { IndexSig } from "src/utils";


const inProgress: IndexSig = {};

export const authService = "https://github.com/login/oauth";
export const graphqlService = "https://api.github.com/graphql";

export async function login(ctx: Koa.Context): Promise<void> {

    const { OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_SECRET } = process.env;

    const state = (ctx && ctx.query && ctx.query.state) ? ctx.query.state : undefined;
    if (!state || !inProgress[state]) {

        // redirect to github oauth service
        // create a random token that is good for 10 mins
        const rand = (Math.round(Math.random() * 100000)).toString();
        inProgress[rand] = ctx.get("Referrer") ? ctx.get("Referrer") : ctx.href;
        setTimeout((n) => { delete inProgress[n]; }, (10 * 60 * 1000), rand);

        const url = new URL(`${authService}/authorize`);
        url.searchParams.set("client_id", `${OAUTH_GITHUB_CLIENT_ID}`);
        url.searchParams.set("scope", "user");
        url.searchParams.set("state", rand);
        url.searchParams.set("allow_signup", "false");
        ctx.redirect(url.href);
        return;
    }

    // we're back from github
    const referrer = inProgress[state];
    delete inProgress[state];
    let err = "", token = "";

    do {
        const code = ctx.query.code;
        if (!code) {
            appendError(ctx, "Missing code in request body");
            ctx.throw("invalid request", 400);
            return;
        }

        // get token
        const url = new URL(`${authService}/access_token`);
        url.searchParams.set("client_id", `${OAUTH_GITHUB_CLIENT_ID}`);
        url.searchParams.set("client_secret", `${OAUTH_GITHUB_SECRET}`);
        url.searchParams.set("code", `${code}`);
        let res = await fetch(url.href, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        let body = (res && res.ok && !res.bodyUsed) ? await res.json() : {};
        if (!res || res.status !== 200 || body.error) {
            console.warn("failed in fetching token. res:", body.error || res);
            const msg = body.error_description ? body.error_description : (res ? res.statusText : "");
            err = "Failed in fetching token. " + msg;
            break;
        }

        const access_token = body.access_token;

        // get username
        res = await fetch(graphqlService, {
            method: "POST",
            body: "{\"query\":\"{viewer{login}}\"",
            headers: {
                Accept: "application/json",
                Authorization: `bearer ${access_token}`,
            },
        });

        // RESPONSE BODY LOOKS LIKE THIS...
        // {
        //   "data": {
        //     "viewer": {
        //       "login": "eram",
        //       "id": "MDQ6VXNlcjEwNDUzNzc="
        //     }
        //   }
        // }
        //
        // ERROR...
        // {
        //   "data": "null",
        //   "errors": [{
        //      message: "Log in to try..."
        //    }]
        // }

        body = (res && res.ok && !res.bodyUsed) ? await res.json() : {};
        const username = (body && body.data && body.data.viewer && body.data.viewer.login) ?
            body.data.viewer.login : undefined;
        if (!res || res.status !== 200 || body.errors || !username) {
            console.warn("failed in fetching token. ", body.errors ? JSON.stringify(body.errors) : res);
            err = "Failed in fetching user. " + res ? res.statusText : "";
            break;
        }

        token = generateJwt({ username });
    } while (0);

    // redirect back to client page
    const url2 = new URL(referrer);
    url2.pathname = `${process.env.PUBLIC_URL}/login`;
    if (err.length) {
        url2.search = `?error=${encodeURIComponent(err)}`;
    } else {
        url2.search = `?token=${encodeURIComponent(token)}`;
    }
    ctx.redirect(url2.href);
}

export async function refresh(ctx: Koa.Context): Promise<void> {

    ctx.status = 200;
    ctx.set("Cache-Control", "no-cache");
    ctx.type = "json";
    ctx.body = {
        ok: true,
    };
}

export async function revoke(ctx: Koa.Context): Promise<void> {

    ctx.status = 200;
    ctx.set("Cache-Control", "no-cache");
    ctx.type = "json";
    ctx.body = {
        ok: true,
    };
}

