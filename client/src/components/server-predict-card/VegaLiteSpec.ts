/*
 * Spec for Vega-Lite graph
 * Examples here: https://vega.github.io/editor/#/examples/vega-lite/point_2d
 * Vega-lite documentatio is here: https://vega.github.io/vega-lite/docs/
 *
 */

export const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v2.json",
    description: "A scatterplot showing TensorFlow prediction of Y for each X.",
    title: "Prediction for each input",
    width: 800,
    autosize: {
        type: "pad",
        resize: true,
        contains: "padding",
    },
    mark: "point",
    selection: {
        grid: {
          type: "interval", bind: "scales",
        },
      },
    encoding: {
        x: { field: "input", type: "quantitative", title: "Input" },
        y: { field: "output", type: "quantitative", title: "Prediction" },
    },
};
