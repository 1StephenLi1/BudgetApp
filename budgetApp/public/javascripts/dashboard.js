$(document).ready(function() {
    $.getJSON('/dashboard/categories', function (categories) {
        updateCategoriesPie(categories);
    });
});

function updateCategoriesPie(categories) {
    data = {
        datasets: [{
            data: categories.totals,
            backgroundColor: [
                "rgb(255, 99, 132)",
                "rgb(54, 162, 235)",
                "rgb(255, 205, 86)"
            ]
        }],
        labels: categories.names
    }

    var categoriesPieContext = document.getElementById('categories-pie').getContext('2d');

    var categoriesPie = new Chart(categoriesPieContext,{
        type: 'pie',
        data: data
    });
}