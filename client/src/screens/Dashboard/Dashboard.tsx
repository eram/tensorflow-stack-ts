import * as React from "react";
import { StatusCard } from "../../components/StatusCard";
import { PredictCard } from "../../components/PredictCard";
import { ClientWrapper } from "../../utils";
import { endpoint } from "../../components/GraphqlTypes";
import "./Dashboard.less";
import auth from "../../components/Auth/Auth";

const client = ClientWrapper.getGlobal(endpoint, auth.getToken);

export const Dashboard = () => {
    return (
        <div>
            <StatusCard sharedClient={client} auth={auth}/>
            <PredictCard sharedClient={client} auth={auth}/>
        </div>
    );
};
