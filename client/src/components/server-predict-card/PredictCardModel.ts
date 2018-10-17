import { Component } from "react";
import { ClientWrapper } from "../../utils";
import { StateMachine, tFrom } from "../../utils";
import { endpoint, predictQuery, IPredictVars, IPredictResp } from "../graphql-types";

enum ModelState { init = 100, predicting, data, err, dismounted }
enum Event { predict, onData, onErr, unmount }

interface ICompState {
    tfInput: string;
    tfOutput: string;
    errStr: string;
    model: PredictCardModel;
    graphData: Array<{ input: number, output: number }>;

    info: string;
}

class PredictCardModel {

    private comp: Component;
    private fsm: StateMachine<ModelState, Event>;
    private client: ClientWrapper;

    constructor(comp: Component, client?: ClientWrapper, fsm?: StateMachine<ModelState, Event>) {
        this.comp = comp;
        this.fsm = fsm || new StateMachine<ModelState, Event>(ModelState.init, [
            tFrom(ModelState.init, Event.predict, ModelState.predicting, this.onPredict.bind(this)),
            tFrom(ModelState.predicting, Event.onData, ModelState.data, this.onData.bind(this)),
            tFrom(ModelState.predicting, Event.onErr, ModelState.init, this.onErr.bind(this)),
            tFrom(ModelState.data, Event.onErr, ModelState.init, this.onErr.bind(this)),
            tFrom(ModelState.data, Event.predict, ModelState.predicting, this.onPredict.bind(this)),

            tFrom(ModelState.init, Event.unmount, ModelState.dismounted),
            tFrom(ModelState.predicting, Event.unmount, ModelState.dismounted),
            tFrom(ModelState.data, Event.unmount, ModelState.dismounted),
            tFrom(ModelState.err, Event.unmount, ModelState.dismounted),
        ]);
        this.client = client || new ClientWrapper(endpoint);
    }

    init(): ICompState {
        return {
            errStr: "",
            tfInput: "[[1,2,3,5,8,13,21,34,55,89]]", // deafult input
            tfOutput: "",
            model: this,
            graphData: [],
            info: "",
        };
    }

    getState() {
        return this.fsm.getState();
    }

    unmount() {
        this.fsm.dispatch(Event.unmount);
    }

    predict() {

        // clean error string and dispatch prediction
        const newState = { tfOutput: "", errStr: "" };
        this.comp.setState(newState);
        this.fsm.dispatch(Event.predict);
    }

    clearGraph() {
        this.comp.setState({ graphData: [] });
    }

    addToGraph() {
        const { tfInput, tfOutput, graphData } = this.comp.state as ICompState;
        let newState: Partial<ICompState> = {};

        do {
            const xs = JSON.parse(tfInput) as Array<[number]>;

            if (!xs || !(xs instanceof Array) || xs.length !== 1 || !(xs[0] instanceof Array) || xs[0].length < 1) {
                newState = { errStr: "Invalid: input must be one dim array" };
                break;
            }

            const ys = JSON.parse(tfOutput) as number[][];
            if (!ys || !(ys instanceof Array) || ys.length !== 1 || !(ys[0] instanceof Array) || ys[0].length < 1) {
                newState = { errStr: "Invalid: prediction must be one dim array" };
                break;
            }

            const xArr = xs[0];
            const yArr = ys[0];

            if (xArr.length !== yArr.length) {
                newState = { errStr: "Invalid: prediction is different in size from input" };
                break;
            }

            xArr.forEach((x, idx) => {
                graphData.push({ input: xArr[idx], output: yArr[idx] });
            });

            newState.graphData = graphData;
        } while (0);

        this.comp.setState(newState);
    }

    // event handelrs are private
    private async onPredict(): Promise<void> {

        const { tfInput } = this.comp.state as ICompState;
        const vars = { tfInput };

        const rc = await this.client.request<IPredictVars, IPredictResp>(predictQuery, vars);

        if (rc) {
            this.fsm.dispatch(Event.onData, rc.predict);
        } else {
            this.fsm.dispatch(Event.onErr, this.client.getErr());
        }
    }

    private onData(data: [string]): void {

        const newState = {} as Partial<ICompState>;

        if (data && data instanceof Array && data.length === 1) {
            newState.tfOutput = data[0];
        }

        if (newState.tfOutput === undefined || typeof newState.tfOutput !== "string") {

            this.fsm.dispatch(Event.onErr, `Invalid data: ${JSON.stringify(data)}`);
            return;
        }

        this.comp.setState(newState);
    }

    private onErr(errStrArr: [string]): void {

        if (errStrArr && errStrArr instanceof Array && errStrArr.length === 1) {
            const newState = { errStr: errStrArr[0] };
            this.comp.setState(newState);
        }
    }
}

export { ICompState, ModelState, PredictCardModel };
