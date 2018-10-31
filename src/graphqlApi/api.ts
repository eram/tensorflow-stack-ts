import * as Model from "../modelProviderBase";
import { SchemaRoot, Query, InputObjectType, InputField, registerEnum, compileSchema } from "typegql";
import { GraphQLSchema } from "graphql";
import { patchGraphQL } from "./patch";
import { trace } from "../utils";
import { getAppGlobals } from "../appGlobals";

const nullTensor = JSON.stringify([]);
const stats = getAppGlobals().stats;

@InputObjectType({ description: "holds an input tensor and the tagged output tensor" })
class TrainData /*implements Model.ITrainData*/ {

    @InputField()
    input: string = nullTensor;

    @InputField()
    output: string = nullTensor;
}

registerEnum(Model.State, { name: "State" });

let model: Model.ModelProviderBase;

@SchemaRoot()
class ApiSchema {

    @Query()
    getState(): string {
        stats.apis++;
        const state = model.getState();
        return Model.State[state];
    }

    @Query()
    getName(): string {
        stats.apis++;
        return model.getName();
    }

    @Query({ type: String })
    async predict(inStr: string): Promise<string> {

        stats.apis++;
        trace("ESTIMATE inStr: ", inStr);

        if (typeof inStr !== "string") {
            throw new Error("Invalid input");
        }

        const inObj = JSON.parse(inStr);
        trace("ESTIMATE inObj: ", inObj);

        if (!inObj || !(inObj instanceof Array)) {
            throw new Error("Invalid input");
        }

        // TODO: validate its a tensor - aka array elements has IOpaqueTensor structre

        const outObj = await model.predict(inObj as Model.IOpaqueTensor[]);

        trace("ESTIMATE3 outObj: ", outObj);

        if (!(outObj instanceof Array)) {
            throw new Error("Estimation failed. Invalid output");
        }

        const rc = JSON.stringify(outObj);
        trace("ESTIMATE outStr: ", rc);
        return rc;
    }

    /*
    @Mutation
      init;
    @Mutation
      compile;
    @Mutation
      fini;
    @Mutation
      train;
    */
}

// stop complaining unused...
export const trainData = new TrainData();

// tslint:disable-next-line:variable-name
export function initApi(_model: Model.ModelProviderBase): GraphQLSchema {
    model = _model;
    return compileSchema({ roots: [ApiSchema] });
}


/* ----------------------------- */
patchGraphQL();
/* ----------------------------- */
