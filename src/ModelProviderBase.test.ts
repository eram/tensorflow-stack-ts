// tslint:disable:mocha-no-side-effect-code
import { ModelProviderBase, ITrainData, State, IOpaqueTensor } from "./modelProviderBase";

class TestProvider extends ModelProviderBase {
    constructor() {
        super("TestProvider");
    }
}

const one: IOpaqueTensor = [1];
const two: IOpaqueTensor = [2];

const trainMe: ITrainData[] = [
    {
        input: one,
        output: one,
    },
    {
        input: two,
        output: two,
    }];


describe("ModelProviderBase class", async () => {

    test("positive flow: init > train > compile > predict > fini", async () => {

        const provider = new TestProvider();
        expect(provider).not.toBeUndefined();

        expect( provider.getName()).toEqual("TestProvider");

        expect(await provider.init()).toBeTruthy();
        expect(provider.getState()).toEqual(State.training);

        expect(await provider.train(trainMe)).toBeTruthy();
        expect(await provider.compile()).toBeTruthy();
        expect(provider.getState()).toEqual(State.compiled);

        expect(await provider.predict([one])).toStrictEqual([one]);
        await provider.fini();
        expect(provider.getState()).toEqual(State.unintialized);
    });

    test("positive flow: init-load > predict > fini", async () => {

        const provider = new TestProvider();
        expect(provider).not.toBeUndefined();

        expect(await provider.init(".")).toBeTruthy();
        expect(provider.getState()).toEqual(State.compiled);
        expect(await provider.predict([one])).toStrictEqual([one]);
        await provider.fini();
        expect(provider.getState()).toEqual(State.unintialized);
    });

});
