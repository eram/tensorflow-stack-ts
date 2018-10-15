/*
 * trace function is void by default but can be overriden in tests with a code
 * like this:
 *
 * // tslint:disable-next-line:no-var-requires no-require-imports no-unsafe-any
 * require("../utils").trace = console.log;
 */
// tslint:disable-next-line:no-any variable-name
export const trace = (_message ?: any, ..._optionalParams: any[]) => void 0;
