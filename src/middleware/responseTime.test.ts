import Koa from "koa";
import { responseTimeHandler } from "./responseTime";

describe("responseTimeHandler tests", () => {

    test("positive flow", async () => {

        const ctx: Partial<Koa.Context> = {
            status: 0,
            set: jest.fn((str1, str2) => { expect(str1 && str2).toBeTruthy(); }),
            body: "",
        };

        await responseTimeHandler(ctx as Koa.Context, async () => {
            return ;
        });

        expect(ctx.set).not.toHaveBeenCalled();
    });

    test("timeout flow", async () => {
        const ctx: Partial<Koa.Context> = {
            status: 0,
            set: jest.fn((str1, str2) => { expect(str1 && str2).toBeTruthy(); }),
            body: "",
        };

        await responseTimeHandler(ctx as Koa.Context, async () => {
            return new Promise<void>((resolve) => {
                setTimeout( () => { resolve(); }, 200);
            });
        });

        expect(ctx.set).toHaveBeenCalled();
    });

});

