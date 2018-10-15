/*
 * This is a method-swizzling (runtime patch) to workaround the below error.
 *
 *      Error: Cannot use GraphQLSchema "[object Object]" from another module or realm.
 *
 *      Ensure that there is only one instance of "graphql" in the node_modules
 *      directory. If different versions of "graphql" are the dependencies of other
 *      relied on modules, use "resolutions" to ensure only one version is installed.
 *
 *      https://yarnpkg.com/en/docs/selective-version-resolutions
 *
 *      Duplicate "graphql" modules cannot be used at the same time since different
 *      versions may have different capabilities and behavior. The data from one
 *      version used in the function from another could produce confusing and
 *      spurious results.
 */

/* tslint:disable */
const instanceOf2: { default(v: {}, c: Function): boolean } = require("graphql/jsutils/instanceOf");

export function patchGraphQL() {

    if (instanceOf2 && instanceOf2.default && typeof instanceOf2.default === "function") {
        instanceOf2.default = patchFunc;
    } else {
        console.error("patchGraphQL failed to locate function to patch")
    }
}

/*
 * patch based on code from 'graphql/jsutils/instanceOf.js'
 */
function patchFunc(value: {}, constructor: Function) {
    if (value instanceof constructor) {
        return true;
    }
    if (value) {
        const valueClass = value.constructor;
        const className = constructor.name;

        if (valueClass && valueClass.name === className) {

            if (className.indexOf("GraphQL") >= 0) return true; // <<<< THIS LINE IS THE PATCH

            throw new Error('Cannot use ' + className + ' "' + value + '" from another module or realm...');
        }
    }
    return false;
}
