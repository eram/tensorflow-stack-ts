const log = require("util").log;
const { injectBabelPlugin} = require("react-app-rewired");
const rewireLess = require("react-app-rewire-less");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const fs = require("fs");

module.exports = function override(config, env) {

    /*
     *  do stuff with the webpack config...
     */

    // antd & crss
    config = injectBabelPlugin(
        ["import", {
            libraryDirectory: "es",
            libraryName: "antd",
            style: true,
        }],
        config);

    config = rewireLess.withLoaderOptions({
        javascriptEnabled: true,
        modifyVars: {
            "@primary-color": "#1DA57A",
        },
    })(config, env);

    // take .env from parent folder
    // this better be done after ejecting with a cmd like this:
    // $ node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/your/env/vars
    config = appendDotenv(config);

    log(JSON.stringify(config, null, 1));
    return config;
};

function appendDotenv(config) {

    const path = "../.env";

    if (!fs.existsSync(path)) {
        log(`appendDotenv: env file not found in '${env}'`);
        return config;
    }

    const myEnv = dotenv.config({ path });

    if (myEnv.error) {
        throw new Error(result.error);
    }

    dotenvExpand(myEnv);
    const env = myEnv.parsed || [];
    var found = 0;

    // take all the REACT_APP_XXX and append into the definitions plugins.
    // dont override existing keys
    const plugin = config.plugins.find(p => p.definitions !== undefined && p.definitions["process.env"]);

    if (plugin) {
        for (var key in env) {
            if (key && key.indexOf("REACT_APP_") === 0) {
                if (!plugin.definitions["process.env"][key]) {
                    plugin.definitions["process.env"][key] = JSON.stringify(env[key]);
                }
                if (!process.env[key]) {
                    process.env[key] = env[key];
                }
                found++;
            }
            // log(`appendDotenv ${elem.indexOf("REACT_APP_") !== -1}: ${elem}=${env[elem]}`);
        }
    }

    if (!found) {
        throw new Error("Missing env vars for React App");
    }

    return config;
}
