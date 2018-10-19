/*
 * trace function is a null function by default but it can an be assigned to console.log or something.
 */

// tslint:disable-next-line:no-any
type fnT = (message?: any, ...optionalParams: any[]) => void;

export let trace: fnT = () => { /* */ };
export function setTrace(fn: fnT) {
    trace = fn;
}
