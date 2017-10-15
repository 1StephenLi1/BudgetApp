var date = moment().subtract(1, 'months').format('YYYY-MM-DD');;
var timeBar;
var categoriesPie;

// Function from https://jsfiddle.net/x04ptfuu/
Chart.plugins.register({
    afterDraw: function(chart) {
    if (chart.data.datasets[0].data == undefined || chart.data.datasets[0].data.length === 0) {
        // No data is present
      var ctx = chart.chart.ctx;
      var width = chart.chart.width;
      var height = chart.chart.height
      chart.clear();
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "12px normal 'Helvetica Nueue'";
      ctx.fillText('Add some data to get started', width / 2, height / 2);
      ctx.restore();
    }
  }
});

$(document).ready(function() {
    $("input:radio[name=filter]").change(function() {
        var selectedFilter = $("input:radio[name=filter]:checked");
        if (selectedFilter.attr('id') == "month") {
            date = moment().subtract(1, 'months').format('YYYY-MM-DD');
        } else if (selectedFilter.attr('id') == "quarter") {
            date = moment().subtract(3, 'months').format('YYYY-MM-DD');
        } else {
            date = moment().subtract(1, 'years').format('YYYY-MM-DD');
        }
        updatePage();
    });
    updatePage();
});

function updatePage() {
    $.getJSON('/dashboard/categories?date=' + date, function (categories) {
        updateCategoriesPie(categories);
    });
    var filter = $("input:radio[name=filter]:checked").attr('id'); // used to determine chart labels
    $.getJSON('/dashboard/time?date=' + date + '&filter=' + filter, function (data) {
        updateTimeBar(data);
    });
    $.getJSON('/dashboard/social?date=' + date, function (data) {
        updateCategoriesBox(data);
    });
}

function updateTimeBar(data) {
    var timeBarCtx = document.getElementById('time-bar').getContext('2d');
    $("#time-bar").attr('height', 220);
    if (timeBar != undefined) timeBar.destroy();
    timeBar = new Chart(timeBarCtx,{
        type: 'bar',
        data: {
            datasets: [{
                data: data.totals,
                backgroundColor: [
                    "rgb(255, 99, 132)",
                    "rgb(54, 162, 235)",
                    "rgb(255, 205, 86)"
                ]
            }],
            labels: data.dates
        },
        options: {
            title: {
                display: true,
                fontSize: 24,
                text: "Spending Over Time"
            },
            scales: {
                xAxes: [{
                    gridLines: false
                }],
                yAxes: [{
                    gridLines: false,
                    ticks: {
                        min: 0,
                        maxTicksLimit: 4
                    }
                }]
            },
            legend: {
                display: false
            }
        }
    });
}

function updateCategoriesPie(categories) {
    var categoriesPieCtx = document.getElementById('categories-pie').getContext('2d');
    $("#categories-pie").attr('height', 220);
    if (categoriesPie != undefined) categoriesPie.destroy();
    categoriesPie = new Chart(categoriesPieCtx,{
        type: 'pie',
        data: {
            datasets: [{
                data: categories.totals,
                backgroundColor: [
                    "rgb(255, 99, 132)",
                    "rgb(54, 162, 235)",
                    "rgb(255, 205, 86)"
                ]
            }],
            labels: categories.names
        },
        options: {
            title: {
                display: true,
                fontSize: 24,
                text: "Spending by Category"
            }
        }
    });
}

var colours = ["red", "aqua", "olive", "yellow", "orange", "teal", "fuchsia"];
function updateCategoriesBox(data) {
    $("#categories-box").empty();
    for (var i = 0; i < data.length; i++) {
        var html = '<div class="col-md-4">';
        html += '<a href="/expenses"><div class="bg-' + colours[i % colours.length] + ' category-box">';
        html +='<h3>' + data[i]["key"] + '</h3>';
        // TODO: show progress towards goal
        html += '<div class="progress"><div class="progress-bar" style="width: 25%"></div></div>';
        // TODO: show goal
        html += '<p><b>$' + data[i]['value']['me'] + '</b> of $???</p>';
        html += '<p class="category-box-social">';
        html += 'Spending more than ' + data[i]['value']['more_than'] + '/' + data[i]['value']['users'] + ' people';
        html += '<br>';
        html += 'Average spend is $' + data[i]['value']['average'].toFixed(0);
        html += '<br></p>';
        html += '</div></a></div>';
        $("#categories-box").append(html);
    }
}