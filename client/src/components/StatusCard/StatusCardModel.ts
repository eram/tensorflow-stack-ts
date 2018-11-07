import { Component } from "react";
import { ClientWrapper } from "../../utils";
import { StateMachine, tFrom } from "../../utils";
import { endpoint, getNameStateQuery, IGetNameStateResp } from "../GraphqlTypes";

enum ModelState { loading, data, err, dismounted }
enum Event { getData, onData, onErr, unmount }

interface ICompState {
    tfModel: string;
    tfState: string;
    errStr: string;
}

class StatusCardModel {

    private comp: Component;
    private fsm: StateMachine<ModelState, Event>;
    private client: ClientWrapper;

    init(comp: Component, client?: ClientWrapper, fsm?: StateMachine<ModelState, Event>): ICompState {
        this.comp = comp;
        this.fsm = fsm || new StateMachine<ModelState, Event>(ModelState.loading, [
            tFrom(ModelState.loading, Event.getData, ModelState.loading, this.onGetData.bind(this)),
            tFrom(ModelState.loading, Event.onData, ModelState.data, this.onData.bind(this)),
            tFrom(ModelState.loading, Event.onErr, ModelState.err, this.onErr.bind(this)),
            tFrom(ModelState.data, Event.onErr, ModelState.err, this.onErr.bind(this)),
            tFrom(ModelState.loading, Event.unmount, ModelState.dismounted),
            tFrom(ModelState.data, Event.unmount, ModelState.dismounted),
            tFrom(ModelState.err, Event.unmount, ModelState.dismounted),
        ]);
        this.client = client || new ClientWrapper(endpoint);

        // kick start state machine
        this.fsm.dispatch(Event.getData);
        return { errStr: "", tfModel: "", tfState: "" };
    }

    getState() {
        return this.fsm.getState();
    }

    unmount() {
        this.fsm.dispatch(Event.unmount);
    }

    // on event methods are private
    private async onGetData(): Promise<void> {

        const rc = await this.client.request<undefined, IGetNameStateResp>(getNameStateQuery);

        if (rc) {
            this.fsm.dispatch(Event.onData, { tfModel: rc.getName, tfState: rc.getState.toString() });
        } else {
            this.fsm.dispatch(Event.onErr, this.client.getErr());
        }
    }

    private onData(data: [Partial<ICompState>]): void {

        let newState = {} as Partial<ICompState>;

        if (data && data instanceof Array && data.length === 1) {
            newState = data[0];
        }

        if (newState.tfModel === undefined || typeof newState.tfModel !== "string"
            || newState.tfState === undefined || typeof newState.tfState !== "string") {

            this.fsm.dispatch(Event.onErr, `Invalid data: ${JSON.stringify(data)}`);
            return;
        }

        this.comp.setState(newState);
    }

    private onErr(errStr: string): void {

        const newState = { errStr };
        this.comp.setState(newState);
    }
}

export { ICompState, ModelState, StatusCardModel };
