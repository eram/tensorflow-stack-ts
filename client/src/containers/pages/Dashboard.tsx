import * as React from "react";
import { StatusCard } from "../../components/server-status-card/StatusCard";
import { PredictCard } from "../../components/server-predict-card/PredictCard";
import { ClientWrapper } from "../../utils";
import { endpoint } from "../../components/graphql-types";
import "./Dashboard.less";

const client = ClientWrapper.getGlobal(endpoint);

export class Dashboard extends React.Component<{}, {}> {
    public render(): JSX.Element {
        return (
            <div>
                <StatusCard title="TensorFlow Server Status Card" client={client} />
                <PredictCard title="TensorFlow Server Predict Card" client={client} />
            </div>
        );
    }
}

