angular.module( 'orderCloud' )

    .config( RetailProfilesConfig )
    .controller( 'RetailProfilesCtrl', RetailProfilesController )
    .controller( 'RetailProfileEditCtrl', RetailProfileEditController )
    .controller( 'RetailProfileCreateCtrl', RetailProfileCreateController )
    .controller( 'RetailProfileAssignCtrl', RetailProfileAssignController )

;
//TODO: listing users and adding users to a group.!!!

function RetailProfilesConfig( $stateProvider ) {
    $stateProvider
        .state( 'retailProfiles', {
            parent: 'base',
            url: '/retailProfiles',
            templateUrl:'retailProfiles/templates/retailProfiles.tpl.html',
            controller:'RetailProfilesCtrl',
            controllerAs: 'retailProfiles',
            data: {componentName: ' Retail Profiles'},
            resolve: {
                RetailProfileList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List(null, 1, 20);
                }
            }
        })
        .state( 'retailProfiles.edit', {
            url: '/:retailProfileid/edit',
            templateUrl:'retailProfiles/templates/retailProfileEdit.tpl.html',
            controller:'RetailProfileEditCtrl',
            controllerAs: 'retailProfileEdit',
            resolve: {
                SelectedUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.Get($stateParams.retailProfileid);
                }
            }
        })
        .state( 'retailProfiles.create', {
            url: '/create',
            templateUrl:'retailProfiles/templates/retailProfileCreate.tpl.html',
            controller:'RetailProfileCreateCtrl',
            controllerAs: 'retailProfileCreate'
        })
        .state('retailProfiles.assign', {
            url: '/:retailProfileid/assign',
            templateUrl: 'retailProfiles/templates/retailProfileAssign.tpl.html',
            controller: 'RetailProfileAssignCtrl',
            controllerAs: 'retailProfileAssign',
            resolve: {
                UserList: function (OrderCloud) {
                    return OrderCloud.Users.List(null, 1, 20);
                },
                AssignedUsers: function ($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.ListUserAssignments($stateParams.retailProfileid);
                },
                SelectedRetailProfile: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.Get($stateParams.retailProfileid);
                }
            }
        })
}

function RetailProfilesController( RetailProfileList, TrackSearch ) {
    var vm = this;
    vm.list = RetailProfileList;
    vm.searching = function() {
        return TrackSearch.GetTerm() ? true : false;
    };
}

function RetailProfileEditController( $exceptionHandler, $state, OrderCloud, SelectedUserGroup ) {
    var vm = this,
        groupID = SelectedUserGroup.ID;
    vm.retailProfileName = SelectedUserGroup.Name;
    vm.retailProfile = SelectedUserGroup;
    vm.retailProfile.ReportingGroup = true;

    vm.Submit = function() {
        OrderCloud.UserGroups.Update(groupID, vm.retailProfile)
            .then(function() {
                $state.go('retailProfiles', {}, {reload:true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.UserGroups.Delete(SelectedUserGroup.ID)
            .then(function() {
                $state.go('retailProfiles', {}, {reload:true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}

function RetailProfileCreateController( $exceptionHandler, $state, OrderCloud ) {
    var vm = this;
    vm.retailProfile = {
        ReportingGroup: true
    };
    vm.Submit = function() {
        OrderCloud.UserGroups.Create(vm.retailProfile)
            .then(function() {
                $state.go('retailProfiles', {}, {reload:true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}

function RetailProfileAssignController(OrderCloud, Assignments, Paging, UserList, AssignedUsers, SelectedRetailProfile) {
    var vm = this;
    vm.RetailProfile = SelectedRetailProfile;
    vm.list = UserList;
    vm.assignments = AssignedUsers;
    vm.saveAssignments = SaveAssignment;
    vm.pagingfunction = PagingFunction;

    function SaveFunc(ItemID) {
        return OrderCloud.UserGroups.SaveUserAssignment({
            UserID: ItemID,
            UserGroupID: vm.RetailProfile.ID
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloud.UserGroups.DeleteUserAssignment(vm.RetailProfile.ID, ItemID);
    }

    function SaveAssignment() {
        return Assignments.saveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc, 'UserID');
    }

    function AssignmentFunc() {
        return OrderCloud.UserGroups.ListUserAssignments(vm.RetailProfile.ID, null, vm.assignments.Meta.PageSize, 'UserID');
    }

    function PagingFunction() {
        return Paging.paging(vm.list, 'Users', vm.assignments, AssignmentFunc);
    }
}