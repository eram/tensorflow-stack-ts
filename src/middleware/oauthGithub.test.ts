import Koa from "koa";
import * as Oauth from "./oauthGithub";
import { URL, URLSearchParams } from "url";

import __fetchMock from "fetch-mock";
const fetchMock = __fetchMock.sandbox();
require("node-fetch").default = fetchMock; // tslint:disable-line:no-var-requires

describe("oauthGithub tests", () => {

    beforeAll(() => {
        if (!process.env.PUBLIC_URL) process.env.PUBLIC_URL = "";
        if (!process.env.OAUTH_GITHUB_CLIENT_ID) process.env.OAUTH_GITHUB_CLIENT_ID = "gitClientId";
        if (!process.env.OAUTH_GITHUB_SECRET) process.env.OAUTH_GITHUB_SECRET = "gitSecret";
    });

    afterEach(fetchMock.restore);

    test("login calls redirect", async () => {
        const ctx: Partial<Koa.Context> = {
            href: "http://a.local/jest",
            redirect: jest.fn((str) => { expect(str).toBeTruthy(); }),
            get: jest.fn((str) => { expect(str).toBeTruthy(); return undefined; }),
        };

        await Oauth.login(ctx as Koa.Context);
        expect(ctx.redirect).toHaveBeenCalled();
    });

    const commonLogin = async () => {
        let state: string = "";
        const ctx: Partial<Koa.Context> = {
            href: "http://a.local/jest",
            redirect: jest.fn((uri) => {
                expect(uri).toBeTruthy();
                const url2 = new URL(uri);
                state = url2.searchParams.get("state") || "";
            }),
            get: jest.fn((str) => { expect(str).toBeTruthy(); return undefined; }),
        };

        await Oauth.login(ctx as Koa.Context);
        expect(ctx.redirect).toHaveBeenCalled();
        expect(state.length > 0).toBeTruthy();
        return state;
    };

    const commonLogin2 = async (state: string) => {
        let token = "";
        const url = new URL(`http://a.local/jest?code=1&state=${state}`);
        const ctx: Partial<Koa.Context> = {
            href: url.href,
            query: {},
            redirect: jest.fn((uri) => {
                expect(uri).toBeTruthy();
                const url2 = new URL(uri);
                token = url2.searchParams.get("token") || "";
            }),
            get: jest.fn((str) => { expect(str).toBeTruthy(); return undefined; }),
        };
        const params = new URLSearchParams(url.search);
        for (const k of params) {
            ctx.query[k[0]] = k[1];
        }

        await Oauth.login(ctx as Koa.Context);
        expect(ctx.redirect).toBeCalled();
        return token;
    };

    test("oauth positive flow", async () => {

        const state = await commonLogin();
        expect(state.length > 0).toBeTruthy();

        const mock1 = fetchMock.mock(`begin:${Oauth.authService}`, {
            status: 200,
            body: {
                access_token: "aToken",
            },
        });

        const mock2 = fetchMock.mock(`begin:${Oauth.graphqlService}`, {
            status: 200,
            body: {
                data: {
                    viewer: {
                        login: "eram",
                    },
                },
            },
        });

        const token = await commonLogin2(state);
        expect(token.length).toBeGreaterThan(4);

        expect(mock1.called()).toBeTruthy();
        expect(mock2.called()).toBeTruthy();
    });

    test("missing code from service", async () => {
        const state = await commonLogin();
        expect(state.length > 0).toBeTruthy();

        const token = await commonLogin2("");
        expect(token === "").toBeTruthy();
    });

    test("oauth service is down", async () => {

        const state = await commonLogin();
        expect(state.length > 0).toBeTruthy();

        const mock1 = fetchMock.mock(`begin:${Oauth.authService}`, 523);
        fetchMock.mock(`begin:${Oauth.graphqlService}`, 523);

        const token = await commonLogin2(state);
        expect(token === "").toBeTruthy();

        expect(mock1.called()).toBeTruthy();
    });

    test("oauth service invalid code", async () => {

        const state = await commonLogin();
        expect(state.length > 0).toBeTruthy();

        const mock1 = fetchMock.mock(`begin:${Oauth.authService}`, 401);
        fetchMock.mock(`begin:${Oauth.graphqlService}`, 200);

        const token = await commonLogin2(state);
        expect(token === "").toBeTruthy();

        expect(mock1.called()).toBeTruthy();
    });

    test("oauth service invalid token", async () => {

        const state = await commonLogin();
        expect(state.length > 0).toBeTruthy();

        const mock1 = fetchMock.mock(`begin:${Oauth.authService}`, {
            status: 200,
            body: {
                access_token: "aToken",
            },
        });

        const mock2 = fetchMock.mock(`begin:${Oauth.graphqlService}`, {
            status: 200,
            body: {
                data: null,
                errors: [{ message: "test error" }],
            },
        });

        const token = await commonLogin2(state);
        expect(token === "").toBeTruthy();

        expect(mock1.called()).toBeTruthy();
        expect(mock2.called()).toBeTruthy();
    });

    test("call refresh", async () => {
        const ctx: Partial<Koa.Context> = {
            href: "http://a.local/jest",
            redirect: jest.fn((str) => { expect(str).toBeTruthy(); }),
            get: jest.fn((str) => { expect(str).toBeTruthy(); return undefined; }),
            set: jest.fn((str) => { expect(str).toBeTruthy(); }),
        };

        await Oauth.refresh(ctx as Koa.Context);
    });

    test("call revoke", async () => {
        const ctx: Partial<Koa.Context> = {
            href: "http://a.local/jest",
            redirect: jest.fn((str) => { expect(str).toBeTruthy(); }),
            get: jest.fn((str) => { expect(str).toBeTruthy(); return undefined; }),
            set: jest.fn((str) => { expect(str).toBeTruthy(); }),
        };

        await Oauth.revoke(ctx as Koa.Context);
    });
});
