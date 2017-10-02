$(document).ready(function() {
    data = {
        datasets: [{
            data: [10, 20, 30]
        }],
    }

    // These labels appear in the legend and in the tooltips when hovering different arcs
    labels: [
        'Red',
        'Yellow',
        'Blue'
    ]

    var categoriesPieContext = document.getElementById('categories-pie').getContext('2d');

    var categoriesPie = new Chart(categoriesPieContext,{
        type: 'pie',
        data: data,
        options: {}
    });
});