import * as Koa from "koa";
import Application from "koa";
import { IRoute, main, appendError } from "./app";
import { Server } from "http";
// tslint:disable-next-line:no-implicit-dependencies
import * as request from "supertest";
import { getAppGlobals } from "./appGlobals";
import { errorChainHandler } from "./middleware/errorChain";

describe("setup koa server", () => {

    let app: Application;
    let srv: Server;
    let agent: request.SuperTest<request.Test>;

    const makeError = jest.fn<Koa.Middleware>(async (ctx: Koa.Context): Promise<void> => {
        appendError(ctx, "makeError called");
        ctx.status = 200;
    });

    const throwFn = jest.fn<Koa.Middleware>(async (ctx: Koa.Context): Promise<void> => {
        ctx.assert(false);
    });

    const longFn = jest.fn<Koa.Middleware>(async (ctx: Koa.Context): Promise<void> => {
        ctx.status = 200;
        return new Promise<void>((resolve) => {
            setTimeout(() => { resolve(); }, 300);
        });
    });

    const breakFn = jest.fn<Koa.Middleware>(async (ctx: Koa.Context): Promise<void> => {
        ctx.status = 200;
        const err = new Error("breakFn called");
        if (Error.captureStackTrace) Error.captureStackTrace(err, breakFn);
        srv.emit("error", err);
    });

    const helloFn = jest.fn<Koa.Middleware>(async (ctx: Koa.Context): Promise<void> => {
        ctx.status = 200;
        ctx.body = "hello";
    });

    const routes: IRoute[] = [{
        method: "get",
        path: "/makeError",
        handler: makeError,
        auth: false,

    },
    {
        method: "get",
        path: "/throw",
        handler: throwFn,
        auth: false,
    },
    {
        method: "get",
        path: "/long",
        handler: longFn,
        auth: false,
    },
    {
        method: "get",
        path: "/break",
        handler: breakFn,
        auth: false,
    },
    {
        method: "static",
        path: "/static",
        folder: "public",
        auth: false,
    },
    {
        method: "get",
        path: "/auth",
        handler: helloFn,
        auth: true,
    }];

    let origProd = false;

    beforeAll(() => {
        process.env.ROUTER_APP = "";
        process.env.JWT_SECRET = "devSecret";
        process.env.JWT_SECRET_PREV = "oldDevSecret";

        origProd = getAppGlobals().prod;
        getAppGlobals().prod = false;
        app = main(routes);
        srv = app.listen(1111);
        agent = request.agent(srv);
    });

    afterAll((done) => {
        if (srv) {
            srv.close(done);
        }
        getAppGlobals().prod = origProd;
    });

    test("check routes validity", async () => {

        expect(() => {
            main([{
                method: "nogood" as "get",
                path: "/",
                handler: breakFn,
                auth: false,
            }]);

        }).toThrow();
    });

    test("router is working", async () => {

        const res = await agent.get(routes[0].path);
        expect(res.status).toEqual(200);
        expect(makeError).toBeCalled();
    });

    test("exception handeling", async () => {

        const res = await agent.get(routes[1].path);
        expect(res.status).toEqual(500);
        expect(throwFn).toBeCalled();
    });

    test("long request", async () => {

        const res = await agent.get(routes[2].path);
        expect(res.status).toEqual(200);
        expect(longFn).toBeCalled();
        // we're not runnign the longRequest middleware when debugger is attached
        if (!getAppGlobals().debugging) {
            expect(res.get("x-response-time")).not.toBeUndefined();
        }
    });

    test("app breaking request", async () => {

        const res = await agent.get(routes[3].path);
        expect(res.status).toEqual(500);
        expect(breakFn).toBeCalled();
        expect(res.body.stack).toBeDefined();
        expect(res.body.stack.length).toBeGreaterThan(100);
    });

    test("static request", async () => {

        const res = await agent.get(routes[4].path);
        expect(res.status).toEqual(200);
        expect(res.type).toEqual("text/html");
    });

    test("auth is needed", async () => {
        const res = await agent.get(routes[5].path);
        expect(res.status).toEqual(401);
    });

    test("app onError is called", async () => {

        // tslint:disable-next-line:no-any
        const ctx = app.createContext({} as any, {} as any);
        ctx.url = "/t1";
        ctx.status = 200;

        const before = getAppGlobals().stats.errors;

        await errorChainHandler(ctx, async () => {
            app.emit("error", new Error("e2"), ctx);
        });

        expect(getAppGlobals().stats.errors).toBeGreaterThan(before);
        expect(ctx.state.errorChain.length).toBeGreaterThan(0);
    });
});
