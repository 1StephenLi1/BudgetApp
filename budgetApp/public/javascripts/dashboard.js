var date = moment().subtract(1, 'months').format('YYYY-MM-DD');;
var timeBar;
var categoriesPie;
var summaryBar;

var colours = ["red", "aqua", "yellow", "purple", "orange", "maroon", "silver", "navy", "green", "teal", "fuchsia", "olive"];

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
    $.getJSON('/dashboard/social?date=' + date + '&filter=' + filter, function (data) {
        updateCategoriesBox(data);
    });
    $.getJSON('/dashboard/goals?date=' + date + '&filter=' + filter, function (data) {
        updateSummaryBar(data);
    });
}

function updateSummaryBar(data) {
    var summaryBarCtx = document.getElementById('summary-bar').getContext('2d');
    $("#summary-bar").attr('height', 100);
    if (summaryBar != undefined) summaryBar.destroy();
    summaryBar = new Chart(summaryBarCtx,{
        type: 'horizontalBar',
        data: {
            datasets: [{
                data: data['data'],
                backgroundColor: colours
            }
            ],
            labels: data['labels']
        },
        options: {
            title: {
                display: true,
                fontSize: 24,
                text: "Summary"
            },
            scales: {
                xAxes: [{
                    gridLines: false,
                    ticks: {
                        callback: function(value, index, values) {
                            return '$' + value;
                        },
                        fontSize: 20,
                        padding: 20
                    },
                    stacked: true
                }],
                yAxes: [{
                    gridLines: false,
                    ticks: {
                        min: 0,
                        maxTicksLimit: 4,
                        fontSize: 20
                    },
                    stacked: true
                }]
            },
            legend: {
                display: false
            },
            tooltips: false
        }
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
                backgroundColor: colours
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
                    gridLines: false,
                    ticks: {
                        fontSize: 14
                    }
                }],
                yAxes: [{
                    gridLines: false,
                    ticks: {
                        min: 0,
                        maxTicksLimit: 4,
                        callback: function(value, index, values) {
                            return '$' + value;
                        },
                        fontSize: 16
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
                backgroundColor: colours
            }],
            labels: categories.names
        },
        options: {
            title: {
                display: true,
                fontSize: 24,
                text: "Spending by Category"
            },
            legend: {
                labels: {
                    fontSize: 20
                }
            }
        }
    });
}


function updateCategoriesBox(data) {
    $("#categories-box").empty();
    for (var i = 0; i < data.length; i++) {
        var html = '<div class="col-md-4">';
        html += '<a href="/expenses?category=' + data[i]["key"] + '"><div class="bg-' + colours[i % colours.length] + ' category-box">';
        html +='<h3>' + data[i]["key"] + '</h3>';
        //if (data[i]['value']['goal_percentage']) {
            // layout issues when boxes of different height
            html += '<div class="progress progress-box"><div class="progress-bar progress-bar-box" style="width: ' + data[i]['value']['goal_percentage'] + '%"></div></div>';
        //}
        html += '<p><b>$' + data[i]['value']['me'];
        if (data[i]['value']['goal']) {
            html += '</b> of $' + data[i]['value']['goal'] + '</p>';
        } else {
            html += '</b></p>';
        }
        html += '<p class="category-box-social">';
        html += 'Spending more than ' + data[i]['value']['more_than'] + '/' + data[i]['value']['users'] + ' people';
        html += '<br>';
        html += 'Average spend is $' + data[i]['value']['average'].toFixed(0);
        html += '<br></p>';
        html += '</div></a></div>';
        $("#categories-box").append(html);
    }
}

function updateProgressBars(data) {
    $("#categories-box").empty();
    for (var i = 0; i < data.length; i++) {
        var html = '<div class="col-md-4">';
        html += '<a href="/expenses?category=' + data[i]["key"] + '"><div class="bg-' + colours[i % colours.length] + ' category-box">';
        html +='<h3>' + data[i]["key"] + '</h3>';
        //if (data[i]['value']['goal_percentage']) {
            // layout issues when boxes of different height
            html += '<div class="progress-box"><div class="progress-bar-box" style="width: ' + data[i]['value']['goal_percentage'] + '%"></div></div>';
        //}
        html += '<p><b>$' + data[i]['value']['me'];
        if (data[i]['value']['goal']) {
            html += '</b> of $' + data[i]['value']['goal'] + '</p>';
        } else {
            html += '</b></p>';
        }
        html += '<p class="category-box-social">';
        html += 'Spending more than ' + data[i]['value']['more_than'] + '/' + data[i]['value']['users'] + ' people';
        html += '<br>';
        html += 'Average spend is $' + data[i]['value']['average'].toFixed(0);
        html += '<br></p>';
        html += '</div></a></div>';
        $("#categories-box").append(html);
    }
}