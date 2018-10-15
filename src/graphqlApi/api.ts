import * as Model from "../modelProviderBase";
import { SchemaRoot, Query, InputObjectType, InputField, registerEnum, compileSchema } from "typegql";
import { GraphQLSchema, GraphQLInt } from "graphql";
import { patchGraphQL } from "./patch";
import { trace } from "../utils";

const nullTensor = JSON.stringify([]);

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

    @Query({ type: () => GraphQLInt })
    getState(): Model.State {
        return model.getState();
    }

    @Query()
    getName(): string {
        return model.getName();
    }

    @Query({ type: String })
    async predict(inStr: string): Promise<string> {

        trace("ESTIMATE inStr: ", inStr);

        if (typeof inStr !== "string") {
            throw new Error("Invalid input");
        }

        const inObj = JSON.parse(inStr);
        trace("ESTIMATE inObj: ", inObj);

        if (!(inObj instanceof Array)) {
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
