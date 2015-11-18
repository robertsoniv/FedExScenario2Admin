describe('Component: UserGroups,', function() {
    var scope,
        q,
        userGroup;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope) {
        q = $q;
        scope = $rootScope.$new();
        userGroup = {
            ID: "TestUserGroup123456789",
            Name: "TestUserGroupTest",
            Description: "Test",
            IsReportingGroup: false
        };
    }));

    describe('State: Base.groups,', function() {
        var state;
        beforeEach(inject(function($state, UserGroups) {
            state = $state.get('base.groups');
            spyOn(UserGroups, 'List').and.returnValue(null);
        }));
        it('should resolve UserGroupList', inject(function ($injector, UserGroups) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(UserGroups.List).toHaveBeenCalled();
        }));
    });

    describe('State: Base.groupEdit,', function() {
        var state;
        beforeEach(inject(function($state, UserGroups) {
            state = $state.get('base.groupEdit');
            var defer = q.defer();
            defer.resolve();
            spyOn(UserGroups, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedUserGroup', inject(function ($injector, $stateParams, UserGroups) {
            $injector.invoke(state.resolve.SelectedUserGroup);
            expect(UserGroups.Get).toHaveBeenCalledWith($stateParams.userGroupid);
        }));
    });

    describe('State: Base.groupAssign,', function() {
        var state;
        beforeEach(inject(function($state, UserGroups, Users) {
            state = $state.get('base.groupAssign');
            spyOn(Users, 'List').and.returnValue(null);
            spyOn(UserGroups, 'ListUserAssignments').and.returnValue(null);
            var defer = q.defer();
            defer.resolve();
            spyOn(UserGroups, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve UserList', inject(function ($injector, Users) {
            $injector.invoke(state.resolve.UserList);
            expect(Users.List).toHaveBeenCalled();
        }));
        it('should resolve AssignedUsers', inject(function ($injector, $stateParams, UserGroups) {
            $injector.invoke(state.resolve.AssignedUsers);
            expect(UserGroups.ListUserAssignments).toHaveBeenCalledWith($stateParams.userGroupid);
        }));
        it('should resolve SelectedUserGroup', inject(function ($injector, $stateParams, UserGroups) {
            $injector.invoke(state.resolve.SelectedUserGroup);
            expect(UserGroups.Get).toHaveBeenCalledWith($stateParams.userGroupid);
        }));
    });

    describe('Controller: UserGroupEditCtrl,', function() {
        var userGroupEditCtrl;
        beforeEach(inject(function($state, $controller, UserGroups) {
            userGroupEditCtrl = $controller('UserGroupEditCtrl', {
                $scope: scope,
                UserGroups: UserGroups,
                SelectedUserGroup: userGroup
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(inject(function(UserGroups) {
                userGroupEditCtrl.userGroup = userGroup;
                userGroupEditCtrl.groupID = userGroup.ID;
                var defer = q.defer();
                defer.resolve(userGroup);
                spyOn(UserGroups, 'Update').and.returnValue(defer.promise);
                userGroupEditCtrl.Submit();
                scope.$digest();
            }));
            it ('should call the UserGroups Update method', inject(function(UserGroups) {
                expect(UserGroups.Update).toHaveBeenCalledWith(userGroupEditCtrl.groupID, userGroupEditCtrl.userGroup);
            }));
            it ('should enter the userGroups state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('base.groups');
            }));
        });
    });

    describe('Controller: UserGroupCreateCtrl,', function() {
        var userGroupCreateCtrl;
        beforeEach(inject(function($state, $controller, UserGroups) {
            userGroupCreateCtrl = $controller('UserGroupCreateCtrl', {
                $scope: scope,
                UserGroups: UserGroups
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(inject(function(UserGroups) {
                userGroupCreateCtrl.userGroup = userGroup;
                var defer = q.defer();
                defer.resolve(userGroup);
                spyOn(UserGroups, 'Create').and.returnValue(defer.promise);
                userGroupCreateCtrl.Submit();
                scope.$digest();
            }));
            it ('should call the UserGroups Create method', inject(function(UserGroups) {
                expect(UserGroups.Create).toHaveBeenCalledWith(userGroup);
            }));
            it ('should enter the userGroups state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('base.groups');
            }));
        });
    });

    describe('Controller: UserGroupAssignCtrl,', function() {
        var userGroupAssignCtrl;
        beforeEach(inject(function($state, $controller, UserGroups) {
            userGroupAssignCtrl = $controller('UserGroupAssignCtrl', {
                $scope: scope,
                UserGroups: UserGroups,
                UserList: [],
                AssignedUsers: [],
                SelectedUserGroup: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignment', function() {
            beforeEach(inject(function(Assignments) {
                var defer = q.defer();
                defer.resolve();
                spyOn(Assignments, 'saveAssignments').and.returnValue(defer.promise);
                userGroupAssignCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.saveAssignments).toHaveBeenCalled();
            }));
        });

        describe('PagingFunction', function() {
            beforeEach(inject(function(Paging) {
                var defer = q.defer();
                defer.resolve();
                spyOn(Paging, 'paging').and.returnValue(defer.promise);
                userGroupAssignCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging) {
                expect(Paging.paging).toHaveBeenCalled();
            }));
        });
    });
});
