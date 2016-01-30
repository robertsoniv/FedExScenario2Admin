angular.module('orderCloud')

    .config(ProductsConfig)
    .controller('ProductsCtrl', ProductsController)
    .controller('ProductEditCtrl', ProductEditController)
    .controller('ProductCreateCtrl', ProductCreateController)
    .controller('PriceScheduleModalCtrl', PriceScheduleModalController)

    .controller('ProductAssignmentsCtrl', ProductAssignmentsController)
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)

;

function ProductsConfig($stateProvider) {
    $stateProvider
        .state('products', {
            parent: 'base',
            url: '/products',
            templateUrl: 'products/templates/products.tpl.html',
            controller: 'ProductsCtrl',
            controllerAs: 'products',
            data: {componentName: 'Products'},
            resolve: {
                ProductList: function (OrderCloud) {
                    return OrderCloud.Products.List();
                }
            }
        })
        .state('products.edit', {
            url: '/:productid/edit',
            templateUrl: 'products/templates/productEdit.tpl.html',
            controller: 'ProductEditCtrl',
            controllerAs: 'productEdit',
            resolve: {
                SelectedProduct: function ($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                }
            }
        })
        .state('products.create', {
            url: '/create',
            templateUrl: 'products/templates/productCreate.tpl.html',
            controller: 'ProductCreateCtrl',
            controllerAs: 'productCreate',
            resolve: {
                PriceScheduleList: function(OrderCloud) {
                    return OrderCloud.PriceSchedules.List();
                }
            }
        })
        .state('products.assignments', {
            url: '/:productid/assignments',
            templateUrl: 'products/templates/productAssignments.tpl.html',
            controller: 'ProductAssignmentsCtrl',
            controllerAs: 'productAssignments',
            resolve: {
                SelectedProduct: function($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                },
                Assignments: function($stateParams, OrderCloud) {
                    return OrderCloud.Products.ListAssignments($stateParams.productid);
                }
            }
        })
        .state('products.createAssignment', {
            url: '/:productid/assignments/new',
            templateUrl: 'products/templates/productCreateAssignment.tpl.html',
            controller: 'ProductCreateAssignmentCtrl',
            controllerAs: 'productCreateAssignment',
            resolve: {
                UserGroupList: function (OrderCloud) {
                    return OrderCloud.UserGroups.List(null, 1, 20);
                },
                PriceScheduleList: function (OrderCloud) {
                    return OrderCloud.PriceSchedules.List(1, 20);
                }
            }
        });
}

function ProductsController(ProductList, TrackSearch) {
    var vm = this;
    vm.list = ProductList;
    vm.searching = function() {
        return TrackSearch.GetTerm() ? true : false;
    };
}

function ProductEditController($exceptionHandler, $state, OrderCloud, SelectedProduct) {
    var vm = this,
        productid = angular.copy(SelectedProduct.ID);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.product = SelectedProduct;

    vm.Submit = function () {
        OrderCloud.Products.Update(productid, vm.product)
            .then(function () {
                $state.go('products', {}, {reload:true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function () {
        OrderCloud.Products.Delete(productid)
            .then(function () {
                $state.go('products', {}, {reload:true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}

function ProductCreateController($exceptionHandler, $state, $uibModal, OrderCloud, PriceScheduleList, buyerid) {
    var vm = this;
    vm.product = {
        Type: 'Static'
    };

    vm.priceSchedules = PriceScheduleList;
    vm.assignment = {
        "BuyerID": buyerid,
        "ProductID": null,
        "StandardPriceScheduleID": null,
        "UserGroupID": "GENERAL"
    };

    vm.selectPriceSchedule = function(scope) {
        vm.assignment.StandardPriceScheduleID == scope.priceSchedule.ID ? vm.assignment.StandardPriceScheduleID = null : vm.assignment.StandardPriceScheduleID = scope.priceSchedule.ID;
    };

    vm.newPriceSchedule = function() {
        $uibModal.open({
            animation: true,
            templateUrl: 'products/templates/newPriceSchedule.modal.tpl.html',
            controller: 'PriceScheduleModalCtrl',
            controllerAs: 'psModal',
            size: 'lg'
        }).result
            .then(function(data) {
                vm.priceSchedules.Items.push(data);
                vm.assignment.StandardPriceScheduleID = data.ID;
            })
    };

    vm.Submit = function () {
        OrderCloud.Products.Create(vm.product)
            .then(function (data) {
                vm.assignment.ProductID = data.ID;
                OrderCloud.Products.SaveAssignment(vm.assignment)
                    .then(function () {
                        $state.go('products', {}, {reload:true})
                    });
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}

function PriceScheduleModalController($uibModalInstance, PriceBreak, OrderCloud) {
    var vm = this;
    vm.priceSchedule = {};
    vm.priceSchedule.RestrictedQuantity = false;
    vm.priceSchedule.PriceBreaks = new Array();

    vm.addPriceBreak = function() {
        PriceBreak.addPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    };

    vm.deletePriceBreak = PriceBreak.deletePriceBreak;

    vm.Submit = function() {
        vm.priceSchedule = PriceBreak.setMinMax(vm.priceSchedule);
        OrderCloud.PriceSchedules.Create(vm.priceSchedule)
            .then(function(data) {
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}

function ProductAssignmentsController($exceptionHandler, $stateParams, $state, OrderCloud, SelectedProduct, Assignments) {
    var vm = this;
    vm.list = Assignments.Items;
    vm.productID = $stateParams.productid;
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.pagingfunction = PagingFunction;

    vm.Delete = function(scope) {
        OrderCloud.Products.DeleteAssignment($stateParams.productid, null, scope.assignment.UserGroupID)
            .then(function() {
                $state.reload();
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            })
    }

    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.TotalPages) {
            OrderCloud.Products.ListAssignments($stateParams.productid, null, null, null, null, vm.list.Meta.Page + 1, vm.list.Meta.PageSize)
                .then(function(data) {
                    vm.list.Items = [].concat(vm.list.Items, data.Items);
                    vm.list.Meta = data.Meta;
                });
        }
    }
}

function ProductCreateAssignmentController($q, $stateParams, $state, Underscore, OrderCloud, UserGroupList, PriceScheduleList) {
    var vm = this;
    vm.list = UserGroupList;
    vm.priceSchedules = PriceScheduleList.Items;
    vm.assignBuyer = false;
    vm.model = {
        ProductID:$stateParams.productid,
        BuyerID: OrderCloud.BuyerID.Get(),
        UserGroupID: null,
        StandardPriceScheduleID: null,
        ReplenishmentPriceScheduleID: null
    };

    vm.toggleReplenishmentPS = function(id) {
        vm.model.ReplenishmentPriceScheduleID == id ? vm.model.ReplenishmentPriceScheduleID = null : vm.model.ReplenishmentPriceScheduleID = id;
    };

    vm.toggleStandardPS = function(id) {
        vm.model.StandardPriceScheduleID == id ? vm.model.StandardPriceScheduleID = null : vm.model.StandardPriceScheduleID = id;
    };

    vm.submit = function() {
        if (!(vm.model.StandardPriceScheduleID || vm.model.ReplenishmentPriceScheduleID) || (!vm.assignBuyer && !Underscore.where(vm.list.Items, {selected:true}).length)) return;
        if (vm.assignBuyer) {
            OrderCloud.Products.SaveAssignment(vm.model).then(function() {
                $state.go('base.productAssignments', {productid:$stateParams.productid});
            })
        } else {
            var assignmentQueue = [];
            angular.forEach(Underscore.where(vm.list.Items, {selected:true}), function(group) {
                assignmentQueue.push((function() {
                    var df = $q.defer();
                    var assignment = angular.copy(vm.model);
                    assignment.UserGroupID = group.ID;
                    OrderCloud.Products.SaveAssignment(assignment).then(function() {
                        df.resolve();
                    });
                    return df.promise;
                })())
            });
            $q.all(assignmentQueue).then(function() {
                $state.go('base.productAssignments', {productid:$stateParams.productid});
            })
        }
    };
}

