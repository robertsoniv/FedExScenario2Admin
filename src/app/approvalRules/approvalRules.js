angular.module( 'orderCloud' )

    .config( ApprovalRulesConfig )
    .controller( 'ApprovalRulesCtrl', ApprovalRulesController )
    .controller( 'ApprovalRuleEditCtrl', ApprovalRuleEditController )
    .controller( 'ApprovalRuleCreateCtrl', ApprovalRuleCreateController )

;

function ApprovalRulesConfig( $stateProvider ) {
    $stateProvider
        .state( 'base.approvalRules', {
            url: '/approvalRules',
            templateUrl:'approvalRules/templates/approvalRules.tpl.html',
            controller:'ApprovalRulesCtrl',
            controllerAs: 'approvalRules',
            data: {componentName: 'Approval Rules'},
            resolve: {
                ApprovalRuleList: function( ApprovalRules) {
                    return ApprovalRules.List();
                }
            }
        })
        .state( 'base.approvalRuleEdit', {
            url: '/approvalRules/:approvalRuleid/edit',
            templateUrl:'approvalRules/templates/approvalRuleEdit.tpl.html',
            controller:'ApprovalRuleEditCtrl',
            controllerAs: 'approvalRuleEdit',
            resolve: {
                SelectedApprovalRule: function( $stateParams, ApprovalRules) {
                    return ApprovalRules.Get($stateParams.approvalRuleid);
                }
            }
        })
        .state( 'base.approvalRuleCreate', {
            url: '/approvalRules/create',
            templateUrl:'approvalRules/templates/approvalRuleCreate.tpl.html',
            controller:'ApprovalRuleCreateCtrl',
            controllerAs: 'approvalRuleCreate'
        })
}

function ApprovalRulesController( ApprovalRuleList ) {
    var vm = this;
    vm.list = ApprovalRuleList;
}

function ApprovalRuleEditController( $state, SelectedApprovalRule, ApprovalRules ) {
    var vm = this,
        approvalRuleID = SelectedApprovalRule.ID;
    vm.approvalRuleName = SelectedApprovalRule.ApprovalRuleName;
    vm.approvalRule = SelectedApprovalRule;

    vm.Submit = function() {
        ApprovalRules.Update(approvalRuleID, vm.approvalRule)
            .then(function() {
                $state.go('^.approvalRules')
            });
    };

    vm.Delete = function() {
        ApprovalRules.Delete(SelectedApprovalRule.ID)
            .then(function() {
                $state.go('^.approvalRules')
            });
    }
}

function ApprovalRuleCreateController($state, ApprovalRules) {
    var vm = this;
    vm.approvalRule = {};

    vm.Submit = function() {
        ApprovalRules.Create(vm.approvalRule)
            .then(function() {
                $state.go('^.approvalRules')
            });
    }
}