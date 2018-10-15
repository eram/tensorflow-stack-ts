import { trace } from "./log";
// import "jest";

test("load only", () => {
    trace(1);
    expect(trace).toBeInstanceOf(Function);
});
