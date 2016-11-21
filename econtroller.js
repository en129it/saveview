var MyController = (function () {
	/* @nginject */
	function MyController(MyService) {
		this.focusMode = 'account'; // account, transaction-in-account, transaction
		this.parentAccount;
		
		this.changeFocusMode = function(newFocusMode) {
			this.focusMode = newFocusMode;
			console.log("##### changeFocusMode " + newFocusMode);
		}
	}
	return MyController;
})();
