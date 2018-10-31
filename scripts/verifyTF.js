/*
 * This file is a little app to test that TensorFlow.js is properly installed.
 *
 * Run it with
 * > node verifyTF
 *
 * and check for problems on the console.
 * NOTE! Does not run under jest.
 */

async function tfTest() {

    process.env.TF_CPP_MIN_LOG_LEVEL=0
    // Load the TF Node binding:
    const tfjsn = require("@tensorflow/tfjs-node"); // Use '@tensorflow/tfjs-node-gpu' if running with GPU.
    if (!tfjsn) {
        throw new Error("@tensorflow/tfjs-node failed to load.")
    };

    // Load TF
    const tf = require("@tensorflow/tfjs");
    if (!tf || !tf.sequential) {
        throw new Error("@tensorflow/tfjs failed to load.");
    }

    console.log(`TF Backend: ${tf.getBackend()}`);
    console.log("\nTEST: TRAINING...");

    const model = tf.sequential();
    model.add(tf.layers.dense({
        inputShape: [1],
        units: 1,
    }));
    model.compile({
        loss: "meanSquaredError",
        optimizer: "sgd",
    });

    const xArr = new Float32Array(6);
    let i = 0;
    [-1, 0, 1, 2, 3, 4].forEach(elem => {
        xArr[i++] = Number(elem);
    });

    const yArr = new Float32Array([-3, -1, 1, 3, 5, 7]);

    const xs = tf.tensor1d(xArr);
    const ys = tf.tensor1d(yArr);

    const epochs = 10;
    const h = await model.fit(xs, ys, {
        epochs
    });

    console.log("last loss:", h.history.loss[epochs - 1]);

    console.log("\nTEST: PREDICTING...");
    const out = model.predict(tf.tensor2d([10], [1, 1]));
    console.log(await out.data());
}

tfTest().then(() => {
    process.exit(0);
});