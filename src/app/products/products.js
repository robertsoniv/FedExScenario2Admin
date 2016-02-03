angular.module('orderCloud')

    .filter('mandatoryFilter', mandatoryFilter)
    .config(ProductsConfig)
    .controller('ProductsCtrl', ProductsController)
    .controller('ProductEditCtrl', ProductEditController)
    .controller('ProductCreateCtrl', ProductCreateController)
    .controller('PriceScheduleModalCtrl', PriceScheduleModalController)

    .controller('ProductAssignmentsCtrl', ProductAssignmentsController)
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)

;

function mandatoryFilter(Underscore) {
    return function(productsArray, filterType) {
        switch(filterType) {
            case('mandatory'):
                return Underscore.filter(productsArray, function(product) {return product.xp.Mandatory == true});
                break;
            case('optional'):
                return Underscore.filter(productsArray, function(product) {return !product.xp.Mandatory});
                break;
            default:
                return productsArray;
                break;
        }

    }
}

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
                ProductList: function (OrderCloud, buyerid) {
                    return OrderCloud.Products.List(null, null, null, null, null, {'xp.BuyerID':buyerid});
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
                PriceScheduleList: function(OrderCloud, Underscore) {
                    return OrderCloud.PriceSchedules.List()
                        .then(function(data) {
                            data.Items = Underscore.filter(data.Items, function(item) {return item.Name.indexOf('FedExFranchise') > -1});
                            return data;
                        });
                },
                RetailProfileList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List();
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

    vm.toggleFilter = function(filter) {
        vm.filter == filter ? vm.filter = null : vm.filter = filter;
    }
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

function ProductCreateController($q, $exceptionHandler, $state, $uibModal, Underscore, OrderCloud, PriceScheduleList, RetailProfileList, buyerid) {
    var vm = this;
    vm.product = {
        Type: 'Static',
        xp: {
            Global:false,
            BuyerID:'FedExFranchiseBuyer'
        }
    };

    vm.retailProfiles = RetailProfileList;
    vm.priceSchedules = PriceScheduleList;
    vm.assignment = {
        "BuyerID": buyerid,
        "ProductID": null,
        "StandardPriceScheduleID": null,
        "UserGroupID": null
    };

    vm.selectPriceSchedule = function(scope) {
        vm.assignment.StandardPriceScheduleID == scope.priceSchedule.ID ? vm.assignment.StandardPriceScheduleID = null : vm.assignment.StandardPriceScheduleID = scope.priceSchedule.ID;
    };

    vm.toggleRetailProfile = function(scope) {
        scope.profile.Selected = !scope.profile.Selected;
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

    vm.newRetailProfile = function() {};

    vm.Submit = function () {
        OrderCloud.Products.Create(vm.product)
            .then(function (data) {
                var queue = [];
                vm.assignment.ProductID = data.ID;
                angular.forEach(Underscore.where(vm.retailProfiles.Items, {'Selected':true}), function(profile) {
                    var assignment = angular.copy(vm.assignment);
                    assignment.UserGroupID = profile.ID;
                    queue.push(OrderCloud.Products.SaveAssignment(assignment));
                });
                $q.all(queue).then(function() {
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
    };

    vm.cancel = function() {
        $uibModalInstance.close();
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
    };

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

