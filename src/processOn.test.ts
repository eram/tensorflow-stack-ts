// tslint:disable:mocha-no-side-effect-code
import { setProcessHandelers } from "./processOn";
import { AppGlobals } from "./appGlobals";

const appGlobals = new AppGlobals();

describe("processOn testing", () => {

    beforeAll(() => {
        setProcessHandelers(appGlobals);
    });

    test("globals.reloads untouched", () => {
        expect(appGlobals.stats.reloads).toEqual(0);
    });

    /*
     * TODO: How to test signals? maybe need to spawn a child process...
     *

     test("msg", async (done) => {
        if (process && process.send) {
            process.send("hello");
        }
        //async call...
        setTimeout(() => {
            expect(appGlobals.stats && appGlobals.stats.messages && appGlobals.stats.messages === 1).toBeTruthy();
            done();
        }, 300);
    });

    test("exit", async (done) => {

        //const fn = jest.fn<(code: number) => never>(void 0);
        // tslint:disable-next-line:no-any
        //process.exit = <any>fn;

        process.on("SIGHUP");
        // async call...  expect(process.exitCode).toEqual(11);
        setTimeout(() => {
            expect(appGlobals.stats.messages).toEqual(1);
            done();
        }, 300);
    });
    */

});
