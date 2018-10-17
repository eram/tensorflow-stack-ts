import * as React from "react";
import { Card } from "antd";
import * as Model from "./StatusCardModel";
import { ClientWrapper } from "../../utils";
import "./StatusCard.less";


interface IProps {
    title: string;
    client?: ClientWrapper;
    model?: Model.StatusCardModel;
}

export class StatusCard extends React.Component<IProps, Model.ICompState> {

    constructor(props: IProps) {
        super(props);

        const model = this.props.model || new Model.StatusCardModel(this, this.props.client) ;
        this.state = model.init();
    }

    componentWillUnmount(): void {
        this.state.model.unmount();
    }

    render(): JSX.Element {

        switch (this.state.model.getState()) {
            case Model.ModelState.loading:
                return (
                    <Card bordered title="Server Status">
                        <span>Loading data...</span>
                    </Card>
                );

            case Model.ModelState.dismounted:
                return (
                    <Card bordered title="Server Status">
                        <span>Dismounted</span>
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

