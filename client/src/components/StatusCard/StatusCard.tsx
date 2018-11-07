import * as React from "react";
import { Card } from "antd";
import * as Model from "./StatusCardModel";
import { ClientWrapper } from "../../utils";
import "./StatusCard.less";
import auth from "../Auth/Auth";


interface IProps {
    readonly auth?: typeof auth;
    readonly sharedClient?: ClientWrapper;
}

export class StatusCard extends React.Component<IProps, Model.ICompState> {

    protected model = new Model.StatusCardModel();

    constructor(props: IProps) {
        super(props);
        this.state = this.model.init(this, this.props.sharedClient);
    }

    componentWillUnmount(): void {
        this.model.unmount();
    }

    render(): JSX.Element {

        if (this.props.auth && !this.props.auth.isAuthenticated()) {
            return (
                <Card bordered title="Server Status">
                    <span className="status-card-data-error">To use the model you have to log-in</span>
                </Card>
            );
        }

        switch (this.model.getState()) {
            case Model.ModelState.loading:
                return (
                    <Card bordered title="Server Status">
                        <span>Loading data...</span>
                    </Card>
                );

            case Model.ModelState.data:
                return (
                    <Card bordered title="Server Status">
                        <span> Model name: <span className="status-card-data-item">{this.state.tfModel || "unkown"}</span>
                            State: <span className="status-card-data-item">{this.state.tfState || "unkown"}</span>
                        </span>
                    </Card>
                );

            case Model.ModelState.err:
            default:
                return (
                    <Card bordered title="Server Status">
                        <span className="status-card-data-error">Error {this.state.errStr ? ": " + this.state.errStr : ""}</span>
                    </Card>
                );
        }
    }
}

