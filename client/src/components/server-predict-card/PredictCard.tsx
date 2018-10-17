import * as React from "react";
import { Card, Button, Input, Col, Divider, Icon } from "antd";
import "./PredictCard.less";
import * as Model from "./PredictCardModel";
import { ClientWrapper } from "../../utils";

// tslint:disable-next-line:no-var-requires
const VegaLite = require("react-vega-lite");
import { spec } from "./VegaLiteSpec";

interface IProps {
    title: string;
    client?: ClientWrapper;
    model?: Model.PredictCardModel;
}

export class PredictCard extends React.Component<IProps, Model.ICompState> {

    constructor(props: IProps) {
        super(props);

        const model = this.props.model || new Model.PredictCardModel(this, this.props.client);
        this.state = model.init();
    }

    componentWillUnmount(): void {
        this.state.model.unmount();
    }

    render(): JSX.Element {

        return (
            <Card bordered title="Server Predict">
                <Col span={8}>
                    <Input.Group compact={true}>
                        Input: <Input.TextArea className="server-predict-input" autosize={{ minRows: 1, maxRows: 6 }}
                            onPressEnter={() => { this.onPredict(); }}
                            value={this.state.tfInput}
                            onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) => this.updateInputValue(evt)}
                        />
                        <Button type="primary" className={(this.state.tfInput.length < 4) ? " disabled" : ""}
                            onClick={() => { this.onPredict(); }}>Predict
                            <Icon type="right" />
                        </Button>
                    </Input.Group>
                </Col>
                <Col span={1} />
                <Col span={8}>
                    <Input.Group>
                        Prediction: <Input.TextArea autosize={{ minRows: 1, maxRows: 6 }}
                            className={this.state.errStr.length < 2 ?
                                "server-predict-output" : "server-predict-hidden"}
                            value={this.state.tfOutput}
                        />
                        <span className={this.state.errStr.length < 2 ?
                            "server-predict-hidden" : "server-predict-error"} >
                            Error: {this.state.errStr}<br />
                        </span>
                        <Button type="primary" className={(this.state.tfOutput.length < 4) ? "disabled" : ""}
                            onClick={() => { this.onGraphIt(); }}>Graph it
                            <Icon type="down" />
                        </Button>
                        <Button type="ghost" className={(this.state.graphData.length < 1) ? " disabled" : ""}
                            onClick={() => { this.onClearGraph(); }}>Clear graph
                            <Icon type="delete" />
                        </Button>
                    </Input.Group>
                </Col>
                <Divider />
                <Col span={16}>
                    <VegaLite id="vega-lite-chart" spec={spec} data={{ values: this.state.graphData }}
                        enableHover={true}/>
                        <p>Hover-on for point tooltip; Click and drag to pan view; Scroll to zoom in/out</p>
                </Col>
            </Card >
        );
    }

    updateInputValue(evt: React.ChangeEvent<HTMLTextAreaElement>) {
        this.setState({
            tfInput: evt.target.value,
            tfOutput: "",
        });
    }

    onPredict() {
        this.state.model.predict();
    }

    onGraphIt() {
        this.state.model.addToGraph();
    }

    onClearGraph() {
        this.state.model.clearGraph();
    }
}
