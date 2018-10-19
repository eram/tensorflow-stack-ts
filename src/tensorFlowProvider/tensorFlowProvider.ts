/*
 * This is the simplest tensorFlow model for estimating a function like y=2x-1
 * Code adapted from https://medium.com/tensorflow/getting-started-with-tensorflow-js-50f6783489b2
 */

// Load tf binding and library
// tslint:disable-next-line:no-require-imports no-var-requires
// import "@tensorflow/tfjs-node";  // Use '@tensorflow/tfjs-node-gpu' if running with GPU.
import * as tf from "@tensorflow/tfjs";

// tslint:disable-next-line:no-require-imports no-var-requires
// require("canvas-prebuilt"); // needed for tfjs

import { ModelProviderBase, IOpaqueTensor, State, ITrainData } from "../modelProviderBase";
import { trace } from "../utils";

export class TensorFlowProvider extends ModelProviderBase {

    model = tf.sequential();

    constructor() {
        super("single node tf.sequential");

        this.model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
        this.model.compile({
            loss: "meanSquaredError",
            optimizer: "sgd",
        });
    }

    async train(data: ITrainData[]): Promise<boolean> {

        trace("TRAIN 0 state:", this.getState(), " items:", data.length);

        if (this.getState() !== State.training) return false;

        if (!data || !(data instanceof Array) || !data.length) {
            throw new Error("Invalid input: not an array");
        }

        // convert data into tensors: we build one input tensor and one output tensore.
        // note that this is specific for this model. In more complex models we would be calling
        // fit() for each data element seperately.
        const xArr = new Float32Array(data.length);
        const yArr = new Float32Array(data.length);

        data.forEach((elem: ITrainData, idx: number) => {

            trace("TRAIN 1 elem:", elem);

            // each element is expected to be an array with 1 item
            if (!elem.input || !(elem.input instanceof Array) || elem.input.length !== 1
                || typeof elem.input[0] !== "number") {
                throw new Error("Invalid training data.input");
            }
            xArr[idx] = Number(elem.input[0]);

            if (!elem.output || !(elem.output instanceof Array) || elem.output.length !== 1
                || typeof elem.output[0] !== "number") {
                throw new Error("Invalid training data.output");
            }
            yArr[idx] = Number(elem.output[0]);
        });

        trace("TRAIN 2 xArr: ", xArr, " yArr: ", yArr);

        const xs = tf.tensor1d(xArr);
        const ys = tf.tensor1d(yArr);
        trace("TRAIN 3 xs:", xs, "\nys:", ys);

        const epochs = 100; /* should be 500 for good results but for this demo we take rough aproximation... :-) */
        const rc = await this.model.fit(xs, ys, { epochs });

        const lastLoss = Number(rc.history.loss[rc.epoch.length - 1]);
        trace("TRAIN 4 after fit. epoch.length:", rc.epoch.length, " last loss:", lastLoss);
        return (rc.epoch.length === epochs && !isNaN(lastLoss));
    }

    async predict(input: IOpaqueTensor[]): Promise<IOpaqueTensor[]> {

        if (this.getState() !== State.compiled) return [];

        if (!input || !(input instanceof Array) || !input.length) {
            throw new Error("Invalid input: not an array");
        }

        const rc: IOpaqueTensor[] = [];

        // gather results from estimations from *all* opaque tensors
        await Promise.all(input.map(async (elem: IOpaqueTensor, idx: number) => {

            trace("PREDICT  1", elem);

            if (!(elem instanceof Array) || !elem.length || typeof elem[0] !== "number") {
                throw new Error(`Invalid input: ${elem}`);
            }

            const xArr = new Float32Array(elem);
            const xs = tf.tensor2d(xArr, [xArr.length, 1]);

            trace("PREDICT 2", xs);
            const ys = this.model.predict(xs);

            // convert response tensor to IOpaqueTensor
            trace("PREDICT 3", ys);
            if (ys instanceof Array) throw new Error("Unexpected array in predict response");

            const data = await ys.data();

            trace("PREDICT 4", data);

            if (data instanceof Float32Array) {
                const arr = Array.from(data);
                trace("PREDICT 5 arr:", arr);
                rc[idx] = arr;  // dont 'push' because the order arriving here may be different

            } else {
                throw new Error("Unexpected object in predict response");
            }
        }));

        trace("PREDICT 6", rc);
        return rc;
    }
}

export function defaultTrainData(): ITrainData[] {
    const data: ITrainData[] = [];

    // y=>2x-2
    [-1, 0, 1, 2, 3, 4, 20].forEach((x) => {
        const y = 2 * x - 2;
        data.push({ input: [x], output: [y] });
    });

    return data;
}
