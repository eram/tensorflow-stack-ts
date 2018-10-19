import { trace, setTrace } from "./log";

test("load only", () => {
    trace(1);
    expect(trace).toBeInstanceOf(Function);
    setTrace(console.log);
    expect(trace).toEqual(console.log);
});
