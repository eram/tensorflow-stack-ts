import { TensorFlowProvider } from "./tensorFlowProvider";

let tensorFlowProvider: TensorFlowProvider;

export function getModelProvider(): TensorFlowProvider {

    if (!tensorFlowProvider) {
        tensorFlowProvider = new TensorFlowProvider();
    }

    return tensorFlowProvider;
}

export { defaultTrainData } from "./tensorFlowProvider";
export { State } from "../modelProviderBase";
