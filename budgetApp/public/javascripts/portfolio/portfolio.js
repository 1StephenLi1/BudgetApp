var portfoliosDT;
$(document).ready(function() {
    var start = moment().subtract(1, 'months');
    var end = moment();

    function cb(start, end) {
        $('#dateRangePicker span').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    }

    $('#dateRangePicker').daterangepicker({
        locale: {
            format: 'DD/MM/YYYY'
        }, 
        startDate: start,
        endDate: end,
        ranges: {
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'Last 12 Months': [moment().subtract(12, 'months'), moment()],
            'Last 5 Years': [moment().subtract(5, 'years'), moment()],
            'Last 10 Years': [moment().subtract(10, 'years'), moment()],
            'Last 25 Years': [moment().subtract(25, 'years'), moment()]
        },
        alwaysShowCalendars: true,
        opens: "left"
    }, cb);

    cb(start, end);

    portfoliosDT =  $('#portfolios-tbl').DataTable({
        processing: true,
        serverSide: true,
        paging: true,
        autoWidth: true,
        pageLength: 50,
        info: true,
        pagingType: "full_numbers",
        language: {
            lengthMenu: "Display _MENU_ portfolios per page",
            zeroRecords: "No portfolios found",
            info: "Showing _START_ to _END_ of _TOTAL_ portfolios",
            infoEmpty: "No portolios available",
            infoFiltered: "",
            paginate: {
                first: '<i class="fa fa-angle-double-left" aria-hidden="true"></i>',
                previous: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                next: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
                last: '<i class="fa fa-angle-double-right" aria-hidden="true"></i>'
            }
        },
        dom: "<'row'<'col-md-6'B><'col-md-6'f>>rt<'row'<'col-md-6'i><'col-md-6'p>>",
        lengthMenu: [ [10, 25, 50, 100], [10, 25, 50, 100] ],
        buttons: [
            "pageLength",
        ],
        columnDefs: [
            { name: "firstTrade", targets: 0},
            { name: "symbol", targets: 1},
            { name: "shareAmount", targets: 2},
            { name: "boughtPrice", targets: 3},
            { name: "lastestPrice", targets: 4},
            { name: "change", targets: 5},
            { name: "percentChange", targets: 6},
            { name: "profit", targets: 7},
            { orderable: false, targets: 8}
        ],
        order: [0, "DESC"],
        ajax: {
            type: "POST",
            url: "/portfolio/datatable",
            data: function (d) {
                d.startDate = $('#dateRangePicker').data('daterangepicker').startDate.toISOString();
                d.endDate = $('#dateRangePicker').data('daterangepicker').endDate.toISOString();
            }
        },
        columns:[
            {
                data: function(portfolio) {
                    if (portfolio.firstTrade == null) {
                        return "No Category";
                    } else {
                        return moment(portfolio.firstTrade).format('DD/MM/YY');
                    }
                }
            }, {
                data: function(portfolio) {
                    if (portfolio.symbol == null) {
                        return "";
                    } else {
                        return portfolio.symbol;
                    }
                }
            }, {
                data: function(portfolio) {
                    if (portfolio.shareAmount == null) {
                        return "";
                    } else {
                        return portfolio.shareAmount;
                    }
                }
            }, {
                data: function(portfolio) {
                    if (portfolio.boughtPrice == null) {
                        return "";
                    } else {
                        return "$"+roundToTwo(portfolio.boughtPrice);
                    }
                }
            }, {
                data: function(portfolio) {
                    if (portfolio.lastestPrice == null) {
                        return "$0.00";
                    } else {
                        return "$" + roundToTwo(portfolio.lastestPrice);
                    }
                }
            }, {
                data: function(portfolio) {
                    if (portfolio.change == null) {
                        return "$0.00";
                    } else {
                        return "$" + roundToTwo(portfolio.change);
                    }
                }
            }, {
                data: function(portfolio) {
                    if (portfolio.percentChange == null) {
                        return "0.00%";
                    } else {
                        return roundToTwo(portfolio.percentChange*100)+"%";
                    }
                }
            }, {
                data: function(portfolio) {
                    if (portfolio.profit == null) {
                        return "$0.00";
                    } else {
                        return "$" + roundToTwo(portfolio.profit);
                    }
                }
            }, {
                data: function(portfolio) {
                    var buttons = '<div id="'+portfolio.id+'-btns" class="btn-group btn-group-xs pull-right">' +
                    '<a href="/portfolio/editPortfolio?id=' + portfolio.id + '" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Edit portfolio"><span class="glyphicon glyphicon-edit"></span>Edit</a>' +
                    '<button type="button" id="remove-portfolios-btn" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Delete Portfolio" onClick="deletePortfolio('+portfolio.id+');"><span class="glyphicon glyphicon-remove"></span>Delete</button>' +
                    '</div>';
                    return buttons;
                }
            },
        ],
    
    });
});


$('#dateRangePicker').on('apply.daterangepicker', function(ev, picker) {
    portfoliosDT.ajax.reload();
});
$("#portfolio-filters-form").change(function(){
    portfoliosDT.ajax.reload();
});


function deletePortfolio(id) {
    $.ajax({
        url: '/portfolio/' + id,
        method: 'DELETE'
    }).then(function(result) {
        if (result.status == "success") {
            portfoliosDT.ajax.reload();
        }else{
            console.log("delete portfolio failed!!")
        }
    })
}
