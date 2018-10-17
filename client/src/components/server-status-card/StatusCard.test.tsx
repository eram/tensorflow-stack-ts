// Jest snapshot test
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { StatusCard } from ".";

test("jest works", () => {
    expect(1).toBeTruthy();
});

describe("StatusCard testing", () => {

    test("StatusCard snapshot is ok", () => {
        const component = TestRenderer.create(
            <StatusCard title="test status card" />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});

