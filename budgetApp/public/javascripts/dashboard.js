$(document).ready(function() {
    var data = [{
        values: [19, 26, 55],
        labels: ['Residential', 'Non-Residential', 'Utility'],
        type: 'pie'
}];

var layout = {
    margin: {
        l: 20,
        r: 20,
        b: 20,
        t: 20,
        pad: 10
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    height: 300
};

Plotly.newPlot('categories-pie', data, layout);
});