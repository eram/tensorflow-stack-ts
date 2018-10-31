/*
 * This is the simplest tensorFlow model for estimating a function like y=2x-1
 * Code adapted from https://medium.com/tensorflow/getting-started-with-tensorflow-js-50f6783489b2
 */

// just load the tf types so we can compile. the lib itself is loaded in loadTensorFlow()
import * as tf from "@tensorflow/tfjs/dist/index";
import { ModelProviderBase, IOpaqueTensor, State, ITrainData } from "../modelProviderBase";
import { trace } from "../utils";
import { getAppGlobals } from "../appGlobals";
import { IndexSig } from "../utils/typeUtils.test";


// Load tf binding and libraries
function loadTensorFlow() {

    console.log("\n\n==============================\nLoading TensorFlow.js...");

    require("@tensorflow/tfjs");
    console.log("@tensorflow/tfjs loaded");

    if (process.env.TF_LOAD_NODE_LIB === "true") {
        require("@tensorflow/tfjs-node");
        console.log("@tensorflow/tfjs-node loaded");
    }

    if (process.env.TF_LOAD_NODEGPU_LIB === "true") {
        require("@tensorflow/tfjs-node-gpu");
        console.log("@tensorflow/tfjs-node-gpu loaded");
    }

    console.log("tf.version:", tf.version);

    // set soem of the features based on environment
    const features: Partial<tf.Features> = {
        DEBUG: process.env.TP_ENABLE_PROFILER === "true",   // enable profiler.
        IS_BROWSER: false,                                  // running in a browser
        IS_NODE: true,                                      // running under nodejs
        IS_CHROME: false,                                   // ??
        IS_TEST: false,                                     // True if running tfjs unit tests.
        PROD: getAppGlobals().prod,                         // production => disable safety checks to gain performance
        /*
        'WEBGL_CONV_IM2COL'?: boolean;
        'WEBGL_PAGING_ENABLED'?: boolean;
        'WEBGL_MAX_TEXTURE_SIZE'?: number;
        'WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION'?: number;
        'WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE'?: boolean;
        'WEBGL_VERSION'?: number;
        'HAS_WEBGL'?: boolean;
        'WEBGL_RENDER_FLOAT32_ENABLED'?: boolean;
        'WEBGL_DOWNLOAD_FLOAT_ENABLED'?: boolean;
        'WEBGL_FENCE_API_ENABLED'?: boolean;
        'WEBGL_SIZE_UPLOAD_UNIFORM'?: number;
        'BACKEND'?: string;
        'TEST_EPSILON'?: number;
        'TENSORLIKE_CHECK_SHAPE_CONSISTENCY'?: boolean;
        */
    };

    tf.ENV.setFeatures(features);
    console.log("tf.features:", tf.ENV.getFeatures());
    console.log("tf.backend.binding:", (tf.ENV.backend as IndexSig).binding);
    console.log("TensorFlow.js loaded.\n==============================\n\n");
}


export class TensorFlowProvider extends ModelProviderBase {

    static tfLoaded = false;
    private model: tf.Sequential;

    constructor() {
        super("single node tf.sequential");

        if (!TensorFlowProvider.tfLoaded) {
            TensorFlowProvider.tfLoaded = true;
            loadTensorFlow();
        }

        this.model = tf.sequential();
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

        const epochs = 10; /* should be 500 for good results but for this demo we make it rough :-) */
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
