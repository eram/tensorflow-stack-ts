import * as fs from "fs";
import { promisify } from "util";
import { mutate } from "freeze-mutate";

// tslint:disable-next-line:no-any
export interface IOpaqueTensor extends Array<any> {
    // nothing here
}

export interface ITrainData {
    input: IOpaqueTensor;
    output: IOpaqueTensor;
}

export enum State { unintialized = 0, training, compiled, error }

// abstruct class for a model-provider
export class ModelProviderBase {

    protected name = "";
    protected state = State.unintialized;
    protected constructor( name: string ) { /* abstruct class */
        this.name = name ;
    }

    getState(): State {
        return this.state;
    }

    getName(): string {
        return this.name;
    }

    async init(modelFile?: string): Promise<boolean> {

        if (this.state !== State.unintialized) return false;

        let modelLoaded = false;
        if (modelFile) {
            // TODO: load model
            const fsExists = promisify(fs.exists);
            modelLoaded = await fsExists(modelFile);
        }

        if (!modelFile) {
            this.state = State.training;
        } else if (modelLoaded) {
            this.state = State.compiled;
        }

        return this.state === State.training || this.state === State.compiled;
    }

    async fini(): Promise<void> {
        this.state = State.unintialized;
    }


    async train(data: ITrainData[]): Promise<boolean> {
        if (this.state !== State.training) return false;

        let rc = false;

        if (data && data instanceof Array) {
            // todo: train model
            rc = data.length > 0;
        }

        return rc;
    }


    async compile(modelFile?: string): Promise<boolean> {

        if (this.state !== State.training) return false;
        let rc = false;

        // todo: compile model
        rc = true;

        if (modelFile) {
            // save model
            // nothing needs to be done here for this model
        }

        this.state = rc ? State.compiled : State.error;

        return this.state === State.compiled;
    }


    async predict(input: IOpaqueTensor[]): Promise<IOpaqueTensor[]> {

        if (this.state !== State.compiled) return [];

        const rc: IOpaqueTensor[] = [];

        if (input && input instanceof Array && input.length) {

            // run estimation
            // just copy in to out
            input.forEach( (elem: IOpaqueTensor) => {
                rc.push(mutate(elem, elem) as IOpaqueTensor);
            });
        }

        return rc;
    }
}
