// tslint:disable:mocha-no-side-effect-code
import { State, IOpaqueTensor } from "../modelProviderBase";
import { getModelProvider } from "./";
import { TensorFlowProvider, defaultTrainData } from "./tensorFlowProvider";
import { setTrace } from "../utils";

setTrace(console.log);

describe("tensorFlowProvider class", async () => {

    test("load provider", () => {

        const provider = getModelProvider();
        expect(provider).not.toBeUndefined();
        expect(provider.getState()).toEqual(State.unintialized);
    });

    test("init provider with a model", async () => {

        const provider = getModelProvider();
        const rc = await provider.init(".");

        expect(rc).toBeTruthy();
        expect(provider.getState()).toEqual(State.compiled);
    });

    test("train provider", async () => {

        // use local object to prevent collision with other tests
        const provider = new TensorFlowProvider();
        let rc = await provider.init();

        const data = defaultTrainData() ;

        rc = await provider.train(data);
        expect(rc).toBeTruthy();

        rc = await provider.compile();
        expect(rc).toBeTruthy();
    });

    test("predict provider", async () => {

        const provider = new TensorFlowProvider();
        let rc = await provider.init();

        const data = defaultTrainData() ;

        rc = await provider.train(data);
        expect(rc).toBeTruthy();

        rc = await provider.compile();
        expect(rc).toBeTruthy();

        // check results of predication
        const input: IOpaqueTensor = [[12], [12]];
        const output = await provider.predict(input);

        expect(output !== undefined).toBeTruthy();
        expect(output instanceof Array).toBeTruthy();
        expect(output.length).toEqual(2);
        expect(output[0] instanceof Array).toBeTruthy();
        expect(output[0].length).toEqual(1);
        expect(output[0]).toEqual(output[1]);

        const res = Number(output[0][0]); // << res= 22
        expect(res).toBeGreaterThan(10);
        expect(res).toBeLessThan(40);
    });

});
