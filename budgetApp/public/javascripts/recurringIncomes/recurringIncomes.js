var incomesDT;

$(document).ready(function() {
    // var start = moment().subtract(1, 'months');
    // var end = moment();
    //
    // function cb(start, end) {
    //     $('#dateRangePicker span').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    // }
    //
    // $('#dateRangePicker').daterangepicker({
    //     locale: {
    //         format: 'DD/MM/YYYY'
    //     },
    //     startDate: start,
    //     endDate: end,
    //     ranges: {
    //         'Today': [moment(), moment()],
    //         'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    //         'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    //         'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    //         'This Month': [moment().startOf('month'), moment().endOf('month')],
    //         'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    //     },
    //     showWeekNumbers: true,
    //     alwaysShowCalendars: true,
    //     opens: "left"
    // }, cb);
    //
    // cb(start, end);

    incomesDT =  $('#incomes-tbl').DataTable({
        processing: true,
        serverSide: true,
        paging: true,
        autoWidth: true,
        pageLength: 50,
        info: true,
        pagingType: "full_numbers",
        language: {
            lengthMenu: "Display _MENU_ recurring incomes per page",
            zeroRecords: "No recurring incomes found",
            info: "Showing _START_ to _END_ of _TOTAL_ recurring incomes",
            infoEmpty: "No recurring incomes available",
            infoFiltered: "(filtered from _MAX_ total recurring incomes)",
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

            { name: "startDate", targets: 0},
            { name: "endDate", targets: 1},
            { name: "shortDescription", targets: 2},
            { name: "longDescription", targets: 3},
            { name: "interval", targets: 4},
            { name: "frequency", targets: 5},
            { name: "Category.name", targets: 6},
            { name: "amount", className: "text-right", targets: 7},
            { orderable: false, targets: 8}
        ],
        order: [0, "DESC"],
        ajax: {
            type: "POST",
            url: "/recurringIncomes/datatable",
            data: function (d) {
                if ($('#category-select').val() != null && $('#category-select').val().length > 0) {
                    d.categories = JSON.stringify($('#category-select').val());
                }
                // d.startDate = $('#dateRangePicker').data('daterangepicker').startDate.toISOString();
                // d.endDate = $('#dateRangePicker').data('daterangepicker').endDate.toISOString();
            }
        },
        columns:[
            {
                data: function(income) {
                    if (income.startDate == null) {
                        return "";
                    } else {
                        return moment(income.startDate).format('DD/MM/YY');
                    }
                }
            }, {
                data: function(income) {
                    if (income.endDate == null) {
                        return "Until Specified";
                    } else {
                        return moment(income.endDate).format('DD/MM/YY');
                    }
                }
            }, {
                data: function(income) {
                    if (income.shortDescription == null) {
                        return "";
                    } else {
                        return income.shortDescription;
                    }
                }
            }, {
                data: function(income) {
                    if (income.longDescription == null) {
                        return "";
                    } else {
                        return income.longDescription;
                    }
                }
            }, {
                data: function(income) {
                    if (income.interval == null) {
                        return 0;
                    } else {
                        return income.interval;
                    }
                }
            }, {
                data: function(income) {
                    if (income.frequency == null) {
                        return 0;
                    } else {
                        return income.frequency;
                    }
                }
            }, {
                data: function(income) {
                    if (income.CategoryId == null) {
                        return "No Category";
                    } else {
                        return income.Category.name;
                    }
                }
            }, {
                data: function(income) {
                    if (income.amount == null) {
                        return "$0.00";
                    } else {
                        return "$" + roundToTwo(income.amount);
                    }
                }
            }, {
                data: function(income) {
                    if (income.isArchived) {
                        var buttons = '<div id="'+income.id+'-btns" data-toggle="tooltip" data-placement="top" title="This recurring income has already been cancelled" class="btn-group btn-group-xs pull-right tool-tip-div">';
                        buttons += '<button type="button" id="remove-income-btn" class="btn btn-default btn-xs" disabled>Cancelled</button>';
                        buttons += '</div>';
                    } else {
                        var buttons = '<div id="'+income.id+'-btns" class="btn-group btn-group-xs pull-right">'; 
                        if (moment(income.startDate).isAfter(moment())) {
                            buttons += '<button type="button" id="remove-income-btn" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Delete Income" onClick="deleteRecurringIncome('+income.id+');"><span class="glyphicon glyphicon-trash"></span>Delete</button>';
                        } else if (income.endDate == null || moment(income.endDate).isAfter(moment())) {
                            buttons += '<button type="button" id="remove-income-btn" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Cancel Income" onClick="deleteRecurringIncome('+income.id+');"><span class="glyphicon glyphicon-remove"></span>Cancel</button>';
                        }
                        buttons += '</div>';
                    }

                    return buttons;
                }
            },
        ]
    });
});
$('body').tooltip({
    selector: '[data-toggle="tooltip"]'
});
// $('#dateRangePicker').on('apply.daterangepicker', function(ev, picker) {
//     incomesDT.ajax.reload();
// });

$("#income-filters-form").change(function(){
    incomesDT.ajax.reload();
});

function deleteRecurringIncome(id) {
    $.ajax({
        url: '/recurringIncomes/' + id,
        method: 'DELETE'
    }).then(function(result) {
        if (result.status == "success") {
            incomesDT.ajax.reload();
        }
    })
}
