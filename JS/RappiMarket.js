var rappi;
    var _categories;
    var operation;
    function Operations(){};

    operation = new Operations();

    function RappiMarket(products, categories) {
        this.products = products;
        this.categories = categories;
    };

    Operations.prototype.processJsonFile = function(_url){
        console.log(_url);
        var urlData = sessionStorage.getItem("urlData");
        var url;
        
        if(_url == undefined){

            if($('input[name=url]').val().toLowerCase().search("http") == "-1"){
                $("#row_warning").css("display", "inherit");
                return;
            }else{
                $("#row_warning").css("display", "none");
            }

            if(urlData == undefined || urlData == null || urlData == ""){
                url = $('input[name=url]').val();
                sessionStorage.setItem("urlData", url);
            }else{
                if(urlData == $('input[name=url]').val()){
                    url = $('input[name=url]').val();
                }else{
                    url = $('input[name=url]').val();
                    sessionStorage.setItem("urlData", url);
                    sessionStorage.setItem("a_ids", "");
                    sessionStorage.setItem("count", 0);
                    sessionStorage.setItem("id_products", "");
                }
            }
        }

        $.ajax({
            type        : 'POST',
            url         : 'process.php',
            data        : {
                url:(_url == undefined ? url : _url)
            },
            dataType    : 'json',
            encode      : true,
            async       : false, 
            complete: function(response){
                var data = [];
                data = response.responseJSON;  
                rappi = new RappiMarket(data.products, data.categories);
                $('#table').bootstrapTable("destroy");
                rappi.FillTable(rappi.getProducts(), rappi.getCategories(), function() {
                rappi.validateTable();
                    $("#table").on("page-change.bs.table", function(){
                                rappi.validateTable();
                            });
                });
            }
        });
    }

    RappiMarket.prototype.openCharShop = function() {
        $("#modal_CarShop div.modal-body").load("CarShop.html", function(){
            var id_products = sessionStorage.getItem("id_products");
            
            if(id_products != null && id_products != undefined && id_products != ""){
                $("#buyProducts").prop("disabled", false);
            }else{
                $("#buyProducts").prop("disabled", true);
            }

            $("#modal_CarShop").modal("show");
        });
    }

    RappiMarket.prototype.buyProducts = function() {
        waitingDialog.show('Performing Transaction');
        setTimeout(function(){
            $("a[id^=delBuy_]").each(function(){
                var idProduct = $(this).attr("id").split('_')[1];     
                rappi.delToBuy("del_"+idProduct, idProduct);
                $("#row_"+idProduct).remove();
            });
            waitingDialog.hide();
            $("#modal_CarShop").modal("hide");
        }, 5000);

        
    }

    RappiMarket.prototype.calculateTotalPrice = function(idProduct) {
        var totalBuy = 0;
        var price = $("#quantity_"+idProduct).attr("price").split('.').join('');
        var quantity = $("#quantity_"+idProduct).val().split('.').join('').split(',').join('');
        quantity = Number(quantity) > 99 ? 99 : quantity;
        $("#quantity_"+idProduct).val(quantity);

        var totalPrice = Number(price) * Number(quantity);
        $("#total_"+idProduct).val(totalPrice);

        $("input[id^=total_]").each(function(){
            totalBuy += Number($(this).val());
        })
        $("#totalBuy").val(totalBuy);
    }

    RappiMarket.prototype.getProducts = function() {
        return this.products;
    }

    RappiMarket.prototype.getCategories = function() {
        return this.categories;
    }

    RappiMarket.prototype.AdvancedFilter = function() {
        var _products = [];
        var filter = $("#FilterType").val();
        var price = $("#price").val().split('.').join('');

        _products = $.grep(rappi.getProducts(), function(item) {

            return (filter == "Less" ? Number(item.price.split('.').join('')) < Number(price) : Number(item.price.split('.').join('')) > Number(price));
        });
        $('#table').bootstrapTable("destroy");
        rappi.GenerateData(_products, rappi.getCategories());
        rappi.validateTable();
    }

    RappiMarket.prototype.validateTable = function() {
        var count = sessionStorage.getItem("count");
        var a_ids = sessionStorage.getItem("a_ids");

        if (count == null || count == undefined) {
            sessionStorage.setItem("count", 0);
        } else {
            $("#count").text(count);
        }

        if (a_ids != null && a_ids != undefined && a_ids != "") {
            var ids = a_ids.split(',');
            for (x in ids) {
                if (ids[x]) {
                    $("#" + ids[x]).attr("onclick", "");
                    if (ids[x].search("add") != -1) {
                        $("#" + ids[x] + " > i").removeClass("fa-plus-circle");
                        $("#" + ids[x] + " > i").addClass("fa-check");
                        $("#" + ids[x] + " > i").text("Added");
                        $("#del_" + ids[x].split('_')[1]).attr("onclick", "javascript:rappi.delToCar('del_" + ids[x].split('_')[1] + "', '" + ids[x].split('_')[1] + "')");
                        

                    }
                }
            }
        }
    }

    RappiMarket.prototype.addToCar = function(idButton, idProduct) {

        var a_ids = sessionStorage.getItem("a_ids");
        if (a_ids != null && a_ids != undefined && a_ids != "") {
            a_ids = a_ids.replace("del_" + idProduct + ",", "");
            a_ids += idButton + ",";
            sessionStorage.setItem("a_ids", a_ids);
        } else {
            sessionStorage.setItem("a_ids", idButton + ",");
        }

        var id_products = sessionStorage.getItem("id_products");
        if (id_products != null && id_products != undefined && id_products != "") {
            id_products += idProduct + ",";
            sessionStorage.setItem("id_products", id_products);
        } else {
            sessionStorage.setItem("id_products", idProduct + ",");
        }

        $("#del_" + idProduct).attr("onclick", "javascript:rappi.delToCar('del_" + idProduct + "', '" + idProduct + "')");

        var count = Number(sessionStorage.getItem("count"));
        count += 1;
        sessionStorage.setItem("count", count);
        $("#count").text(count);

        $("#" + idButton).attr("onclick", "");
        $("#" + idButton + " > i").removeClass("fa-plus-circle");
        $("#" + idButton + " > i").addClass("fa-check");
        $("#" + idButton + " > i").text("Added");
    }

    RappiMarket.prototype.delToBuy = function(idButton, idProduct){
        rappi.delToCar(idButton, idProduct);

        var total = 0;

        $("#row_"+idProduct).remove();

        $("input[id^=total_]").each(function(){
            total += Number($(this).val());
        });
        $("#totalBuy").val(total);

        var id_products = sessionStorage.getItem("id_products");
            
        if(id_products != null && id_products != undefined && id_products != ""){
            $("#buyProducts").prop("disabled", false);
        }else{
            $("#buyProducts").prop("disabled", true);
        }
    }

    RappiMarket.prototype.delToCar = function(idButton, idProduct) {
        var count = Number(sessionStorage.getItem("count"));
        if (count == 0) {
            return;
        }

        var a_ids = sessionStorage.getItem("a_ids");
        if (a_ids != null && a_ids != undefined && a_ids != "") {
            a_ids = a_ids.replace("add_" + idProduct + ",", "");
            a_ids += idButton + ",";
            sessionStorage.setItem("a_ids", a_ids);
        } else {
            sessionStorage.setItem("a_ids", idButton + ",");
        }

        var id_products = sessionStorage.getItem("id_products");

        if (id_products != null && id_products != undefined && id_products != "") {
            id_products = id_products.replace(idProduct + ",", "");
            sessionStorage.setItem("id_products", id_products);
        }


        $("#" + idButton).attr("onclick", "");
        $("#add_" + idProduct).attr("onclick", "javascript:rappi.addToCar('add_" + idProduct + "', '" + idProduct + "')");
        $("#add_" + idProduct + " > i").removeClass("fa-check");
        $("#add_" + idProduct + " > i").addClass("fa-plus-circle");
        $("#add_" + idProduct + " > i").text("Add");

        count -= 1;
        sessionStorage.setItem("count", count);
        $("#count").text(count);
    }

    RappiMarket.prototype.GenerateData = function(products, categories) {
        var tbody = "";

        for (var i in products) {
            tbody += "<tr>" +
                "<td>" + "<img src = '" + products[i].img + "' width='80px' height='50px'></td>" +
                "<td>" + products[i].name.toLowerCase() + "</td>" +
                "<td>" + products[i].price.split('.').join('') + "</td>" +
                "<td>" + products[i].available + "</td>" +
                "<td>" + products[i].best_seller + "</td>";

            var categories_id = products[i].categories;
            var categories_name = "";
            for (var x in categories_id) {
                for (var y in categories) {
                    if (categories[y].categori_id == categories_id[x]) {
                        categories_name += categories[y].name + ", ";
                    }
                }
            }

            tbody += "<td>" + categories_name.substring(0, categories_name.length - 2) + "</td>" +
                "<td>" + products[i].description + "</td>" +
                "<td><a style='cursor:pointer;' id='add_" + products[i].id + "' onclick=\"javascript:rappi.addToCar('add_" + products[i].id + "', '" + products[i].id + "')\"><i class = 'fa fa-plus-circle' aria-hidden='true'> Add</i></a></td>" +
                "<td><a style='cursor:pointer;' id='del_" + products[i].id + "'><i class = 'fa fa-minus-circle' aria-hidden='true'> Delete</i></a></td>" +
                "</tr>"
        }

                _categories = "{";

                for (var i in rappi.getCategories()) {
                    _categories += "\"" + rappi.getCategories()[i].name + "\":" + "\"" + rappi.getCategories()[i].name + "\","
                }

                _categories = _categories.substring(0, _categories.length - 1);
                _categories += "}";
                _categories = JSON.parse(_categories);

        $("#table > tbody").empty();
        $("#table > tbody").append(tbody);
        $('#table').bootstrapTable({
            columns: [{
                field: 'img',
                title: 'Image',
            }, {
                field: 'name',
                title: 'Product',
                sortable:true,
                filterControl:"input"
            }, {
                field: 'price',
                title: 'Price',
                sortable:true,
                filterControl:"input",
                sorter:"numericOnly",
                filterStrictSearch:true
            },
            {
                field: 'available',
                title: 'Available',
                sortable:true,
                filterControl:"select",
            },
            {
                field: 'best_seller',
                title: 'Best Seller',
                sortable:true,
                filterControl:"select",
            },
            {
                field: 'category',
                title: 'Category',
                sortable:true,
                filterControl:"select",
                filterData:"var:_categories"
            },
            {
                ield: 'description',
                title: 'Description',
            },
            {
                field: 'add',
                title: 'Add to Car',
            },
            {
                ield: 'del',
                title: 'Del to Car',
            }]
        });  

        $(".row .fixed-table-toolbar > div:first-child").prepend(
            "<button class=\"btn btn-default\" type=\"button\" id=\"advanced_search\" data-toggle=\"modal\" data-target=\"#modal_advancedSearch\"><i class=\"glyphicon glyphicon-search\"></i></button>" +
            "<button class=\"btn btn-default\" type=\"button\" id=\"clear_filter\"><i class=\"glyphicon glyphicon-trash icon-clear\"></i></button>"
        );

        $("#clear_filter").on("click", function() {
            $('#table').bootstrapTable("destroy");
            rappi.GenerateData(rappi.getProducts(), rappi.getCategories());
            rappi.validateTable();
        });

        tbody = "";
    }

    RappiMarket.prototype.FillTable = function(products, categories, fn) {

        rappi.GenerateData(products, categories);

        if (typeof fn == "function") {
            fn();
        }
    }

    $(document).ready(function() {
        var _url = sessionStorage.getItem("urlData");
        if(_url != undefined && _url != null && _url != ""){
            $('input[name=url]').val(_url); 
            operation.processJsonFile(_url);
        }else{
            operation.processJsonFile("http://jsonfiles.azurewebsites.net/data1.html");
        }      
    });