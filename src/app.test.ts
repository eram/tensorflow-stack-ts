import * as Koa from "koa";
import { IRoute, RouterHandler, main, appendError } from "./app";
import { Server } from "http";
// tslint:disable-next-line:no-implicit-dependencies
import * as request from "supertest";


describe("setup koa server", () => {

    let app: Server;
    let agent: request.SuperTest<request.Test>;

    const makeError = jest.fn<RouterHandler>(async (ctx: Koa.Context): Promise<void> => {
        appendError(ctx, "makeError called");
        ctx.status = 200;
    });

    const throwFn = jest.fn<RouterHandler>(async (ctx: Koa.Context): Promise<void> => {
        ctx.assert(false);
    });

    const longFn = jest.fn<RouterHandler>(async (ctx: Koa.Context): Promise<void> => {
        ctx.status = 200;
        return new Promise<void>((resolve) => {
            setTimeout(() => { resolve(); }, 300);
        });
    });

    const breakFn = jest.fn<RouterHandler>(async (ctx: Koa.Context): Promise<void> => {
        ctx.status = 200;
        const err = new Error("breakFn called");
        if (Error.captureStackTrace) Error.captureStackTrace(err, breakFn);
        app.emit("error", err);
    });

    const routes: IRoute[] = [{
        method: "get",
        path: "/makeError",
        handler: makeError,
    },
    {
        method: "get",
        path: "/throw",
        handler: throwFn,
    },
    {
        method: "get",
        path: "/long",
        handler: longFn,
    },
    {
        method: "get",
        path: "/break",
        handler: breakFn,
    }];

    beforeAll(() => {
        process.env.ROUTER_APP = "";
        app = main(routes).listen(1111);
        agent = request.agent(app);
    });

    afterAll((done) => {
        if (app) {
            app.close(done);
        }
    });

    test("check routes validity", async () => {

        expect(() => {
            main([{
                method: "nogood" as "get",
                path: "/",
                handler: breakFn,
            }]);

        }).toThrow();
    });

    test("router is working", async () => {

        let res = await agent.get(routes[0].path);
        expect(res.status).toEqual(200);
        expect(makeError).toBeCalled();

        res = await agent.get("/notFound");
        expect(res.status).toEqual(404);
    });

    test("exception handeling", async () => {

        const res = await agent.get(routes[1].path);
        expect(res.status).toEqual(500);
        expect(throwFn).toBeCalled();
    });

    test("long request", async () => {

        const res = await agent.get(routes[2].path);
        expect(res.status).toEqual(200);
        expect(res.get("x-response-time")).not.toBeUndefined();
        expect(longFn).toBeCalled();
    });

});
