var MyAccountController = (function () {
	/* @nginject */
	function MyAccountController(MyService, $scope) {
		this.views = MyService.getViews();
		this.defaultViewId = null;
		this.mustShowAllActions = false;
		this.activeViewId = null;
		this.isViewRenameValid = true;
		this.viewRenameValue = "";
		
		$scope.viewRename = function(newName) {
			if (angular.isDefined(newName)) {
				this.myAcctCont.isViewRenameValid = true;
				for (var i=0; i<this.myAcctCont.views.length; i++) {
					if (this.myAcctCont.views[i].label==newName) {
						this.myAcctCont.isViewRenameValid = false;
					}
				}
				this.myAcctCont.viewRenameValue = newName;
			} else {
				return this.myAcctCont.viewRenameValue;
			}
		}
		
		this.getIsViewRenameValid = function() {
			return this.isViewRenameValid;
		}
		
		this.showAllActions = function() {
			return this.mustShowAllActions;
		} 
		
		this.showAllActionsAction = function(flag) {
			this.mustShowAllActions = flag;
		}
		
		this.saveAction = function() {
		}
		
		this.getPredefinedViews = function() {
			var rslt = new Array();
			this.views.forEach(function(item){
				if (item.isPredefinedView) {
					rslt.push(item);
				}
			});
			return rslt;
		}
		
		this.getCustomViews = function() {
			var rslt = new Array();
			this.views.forEach(function(item){
				if (!item.isPredefinedView) {
					rslt.push(item);
				}
			});
			return rslt;
		}
		
		this.getDefaultView = function() {
			for (var i=0; i<this.views.length; i++) {
				if (this.views[i].id==this.defaultViewId) {
					return this.views[i];
				}
			}
			
			var rslt = this.getPredefinedViews()[0];
			this.defaultViewId = rslt.id;
			return rslt;
		}
		
		this.getActiveView = function() {
			for (var i=0; i<this.views.length; i++) {
				if (this.views[i].id==this.activeViewId) {
					return this.views[i];
				}
			}

			var rslt = this.getDefaultView();
			this.activeViewId = rslt.id;
			return rslt;
		}
		
		this.changeDefaultView = function(viewId) {
			this.defaultViewId = viewId;
		}
		
		this.changeActiveView = function(viewId) {
			this.activeViewId = viewId;
		}
		
		this.deleteActiveView = function() {
			var pos = this.views.indexOf(this.getActiveView());
			this.views.splice(pos, 1);
		}
		
		this.renameActiveView = function() {
			this.getActiveView().label = $scope.viewRename();
			this.viewRenameValue = null;
			this.isViewRenameValid = true;
		}
		
		this.createNewView = function() {
			var newView = new View(this.findFreeViewId(), $scope.viewRename(), $scope.viewRename(), false);
			this.views.push(newView);
			this.activeViewId = newView.id;
			this.viewRenameValue = null;
			this.isViewRenameValid = true;
		}
		
		this.findFreeViewId = function() {
			var maxId = 0;
			this.views.forEach(function(item){
				maxId = Math.max(item.id, maxId);
			});
			return maxId+1;
		}
		
		this.makeActiveDefaultView = function() {
			this.defaultViewId = this.activeViewId;
		}
		
	}
	return MyAccountController;
})();
