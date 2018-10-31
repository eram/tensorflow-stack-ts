/*
 *  config-overrides.js is the place to transform the webpack config beofre it is compiled.
 *  This is relevant until you "eject" the project from react-create-app.
 */
const log = require("util").log;
const { injectBabelPlugin } = require("react-app-rewired");
const rewireLess = require("react-app-rewire-less");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const fs = require("fs");

module.exports = function override(config, env) {

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

    if (!process.env.REACT_APP_ENDPOINT) {
        // take .env from parent folder
        // this better be done after ejecting with a cmd like this:
        // $ node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/your/env/vars
        config = appendDotenv(config);
    }

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

    // build environment into config
    let plugin = config.plugins.find(p => p.definitions !== undefined && p.definitions["process.env"]);
    if (plugin) {

        const pdefs = plugin.definitions["process.env"];

        pdefs.REACT_APP_BUILDTIME = new Date().valueOf().toString();

        for (var key in env) {
            if (key) {

                // take all the REACT_APP_XXX and append into the definitions plugins.
                if (key.indexOf("REACT_APP_") === 0) {
                    pdefs[key] = JSON.stringify(env[key]);
                    process.env[key] = env[key];
                    found++;
                } else

                // PUBLIC_URL is required for root of app
                if (key === "PUBLIC_URL") {
                    pdefs[key] = JSON.stringify(env[key]);
                    process.env[key] = env[key];
                    log(`process.env.PUBLIC_URL: ${env[key]}`);
                } else

                // PORT is the Webpack dev server port
                if (key === "REACT_DEVSRV_PORT") {
                    process.env.PORT = Number.parseInt(env.REACT_DEVSRV_PORT, 10);
                    log(`process.env.PORT: ${process.env.PORT}`);
                }
            }
        }
    }

    if (!found) {
        throw new Error("Missing env vars for React App");
    }

    /*
    // update plugins.replacements.PUBLIC_URL
    plugin = config.plugins.find(p => p.replacements !== undefined);
    if (plugin) {
        plugin.replacements.PUBLIC_URL = `\"${process.env.PUBLIC_URL}\"`;
    }

    config.output.publicPath = process.env.PUBLIC_URL;
    */

    return config;
}
