import * as React from "react";
import { Card, Button, Input, Col, Divider, Icon } from "antd";
import "./PredictCard.less";
import * as Model from "./PredictCardModel";
import { ClientWrapper } from "../../utils";
import auth from "../../components/Auth/Auth";

// tslint:disable-next-line:no-var-requires
const VegaLite = require("react-vega-lite");
import { spec } from "./VegaLiteSpec";

interface IProps {
  readonly auth?: typeof auth;
  readonly sharedClient?: ClientWrapper;
}

export class PredictCard extends React.Component<IProps, Model.ICompState> {

  protected model = new Model.PredictCardModel();

  constructor(props: IProps) {
    super(props);

    this.state = this.model.init(this, this.props.sharedClient);
  }

  componentWillUnmount(): void {
    this.model.unmount();
  }

  render(): JSX.Element {
    if (this.props.auth && !this.props.auth.isAuthenticated()) {
      return (<br />);
    }

    return (
      <Card bordered title="Server Predict">
        <Col span={10}>
          <Input.Group compact={true}>
            Input: <Input.TextArea autosize={{ minRows: 1, maxRows: 6 }}
              className="server-predict-input"
              onPressEnter={() => { this.onPredict(); }}
              value={this.state.tfInput}
              onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) => this.updateInputValue(evt)}
            />
            <Button type="primary"
              className={(this.state.tfInput.length < 4) ? " disabled" : ""}
              onClick={() => { this.onPredict(); }}>Predict
                        <Icon type="right" />
            </Button>
          </Input.Group>
        </Col>
        <Col span={1} />
        <Col span={10}>
          {!this.state.errStr.length && (
            <Input.Group>
              Prediction:
                            <Input.TextArea autosize={{ minRows: 1, maxRows: 6 }}
                className="server-predict-output"
                value={this.state.tfOutput} />
              <br />
              <Button type="primary" className={(this.state.tfOutput.length < 4) ? "disabled" : ""}
                onClick={() => { this.onGraphIt(); }}>
                Graph it
                                <Icon type="down" />
              </Button>
              <Button type="ghost" className={(this.state.graphData.length < 1) ? " disabled" : ""}
                onClick={() => { this.onClearGraph(); }}>
                Clear graph
                                <Icon type="delete" />
              </Button>
            </Input.Group>
          )}
          {!!this.state.errStr.length && (
            <span className="server-predict-error">
              Error: {this.state.errStr}<br />
            </span>
          )}
        </Col>
        <Divider />
        <Col span={21}>
          <VegaLite id="vega-lite-chart" spec={spec} data={{ values: this.state.graphData }}
            enableHover={true} />
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
    this.model.predict();
  }

  onGraphIt() {
    this.model.addToGraph();
  }

  onClearGraph() {
    this.model.clearGraph();
  }
}
