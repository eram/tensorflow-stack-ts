import * as Koa from "koa";
import { healthcheckRequest } from "./healthcheck";

describe("healthcheck functional tests", () => {

    test("ctx is setup correctly", async () => {

        const ctx: Partial<Koa.Context> = {
            status: 0,
            set: jest.fn((str1, str2) => { expect(str1 && str2).toBeTruthy(); }),
            body: "",
        };

        await healthcheckRequest(ctx as Koa.Context);

        expect(ctx.status).toEqual(200);
        expect(ctx.set).toHaveBeenCalled();
    });
});

