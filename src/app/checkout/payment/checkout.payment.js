angular.module('orderCloud')
	.config(checkoutPaymentConfig)
	.controller('CheckoutPaymentCtrl', CheckoutPaymentController)
;

function checkoutPaymentConfig($stateProvider) {
	$stateProvider
		.state('checkout.payment', {
			url: '/payment',
			templateUrl: 'checkout/payment/templates/checkout.payment.tpl.html',
			controller: 'CheckoutPaymentCtrl',
			controllerAs: 'checkoutPayment',
			resolve: {
                AvailableCreditCards: function(OrderCloud) {
                    // TODO: Needs to be refactored to work with Me Service
                    return OrderCloud.CreditCards.List();
                },
                AvailableSpendingAccounts: function(OrderCloud) {
                    // TODO: Needs to be refactored to work with Me Service
                    return OrderCloud.SpendingAccounts.List(null, null, null, null, null, {'RedemptionCode': '!*'});
                }
			}
		});
}

function CheckoutPaymentController($state, AvailableCreditCards, AvailableSpendingAccounts, OrderCloud, toastr) {
	var vm = this;
    vm.paymentMethods = [
        {Display: 'Purchase Order', Value: 'PurchaseOrder'},
        {Display: 'Credit Card', Value: 'CreditCard'},
        {Display: 'Spending Account', Value: 'SpendingAccount'}//,
        //{Display: 'Pay Pal Express Checkout', Value: 'PayPalExpressCheckout'}
    ];
    vm.CreditCardTypes = [
        'MasterCard',
        'American Express',
        'Discover',
        'Visa'
    ];
    vm.creditCard = null;
    vm.today = new Date();
    vm.creditCards = AvailableCreditCards.Items;
    vm.spendingAccounts = AvailableSpendingAccounts.Items;
    vm.setCreditCard = SetCreditCard;
    vm.saveCreditCard = SaveCreditCard;
    vm.setSpendingAccount = SetSpendingAccount;
    vm.setPaymentMethod = SetPaymentMethod;

    function SetPaymentMethod(order) {
        if (order.PaymentMethod) {
            // When Order Payment Method is changed it will clear out all saved payment information
            OrderCloud.Orders.Patch(order.ID, {PaymentMethod: order.PaymentMethod, CreditCardID: '', SpendingAccountID: ''})
                .then(function() {
                    $state.reload();
                });
        }
    }

    function SaveCreditCard(order) {
        // TODO: Needs to save the credit card with integration plug in
        if (vm.creditCard) {
            // This is just until Nick gives me the integration
            vm.Token = 'cc';
            if (vm.creditCard.PartialAccountNumber.length === 16) {
                vm.creditCard.PartialAccountNumber = vm.creditCard.PartialAccountNumber.substr(vm.creditCard.PartialAccountNumber.length - 4);
                OrderCloud.CreditCards.Create(vm.creditCard)
                    .then(function(CreditCard) {
                        OrderCloud.Me.Get()
                            .then(function(me) {
                                OrderCloud.CreditCards.SaveAssignment({
                                        CreditCardID: CreditCard.ID,
                                        UserID: me.ID
                                    })
                                    .then(function() {
                                        OrderCloud.Orders.Patch(order.ID, {CreditCardID: CreditCard.ID})
                                            .then(function() {
                                                $state.reload();
                                            });
                                    });
                            });
                    });
            }
            else {
                toastr.error('Invalid credit card number.', 'Error:');
            }
        }
    }

    function SetCreditCard(order) {
        if (order.CreditCardID && order.PaymentMethod === 'CreditCard') {
            OrderCloud.Orders.Patch(order.ID, {CreditCardID: order.CreditCardID})
                .then(function() {
                    $state.reload();
                });
        }
    }

    function SetSpendingAccount(order) {
        if (order.SpendingAccountID && order.PaymentMethod === 'SpendingAccount') {
            OrderCloud.Orders.Patch(order.ID, {SpendingAccountID: order.SpendingAccountID})
                .then(function() {
                    $state.reload();
                });
        }
    }
}