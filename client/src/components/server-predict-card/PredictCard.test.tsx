// Jest snapshot test
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { PredictCard } from ".";

test("jest works", () => {
    expect(1).toBeTruthy();
});

describe("PredictCard testing", () => {

    test("PredictCard snapshot is ok", () => {
        const component = TestRenderer.create(
            <PredictCard title="test predict card" />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});

