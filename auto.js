angular.module("MyRegistry", ['ngRoute', 'ngMaterial'])
.service('MyService', MyService)
.controller('MyController', MyController)
.controller('MyAccountController', MyAccountController)
.controller('AutocompleteController', AutocompleteController)
.directive('chipsAutocomplete', ChipsAutocomplete)
;

// Usage : <chips-autocomplete placeholder="Here..." minchars="3" searchtext="searchText" suggestions="item in myCont.getMatches(searchText)"></chips-autocomplete>


/* @nginject */
function AutocompleteController($scope, $element, $mdUtil, $mdConstant, $mdTheming, $window, $animate, $rootElement, $attrs, $q, $timeout) {
	this.isRequired = true;
	this.isDisabled = false;
	this.scope = $scope;
	this.timer = null;
	this.suggestions = [];
	this.suggestionPromiseProcessing = false;
	
	this.scope.searchText = "";
	this.suggestionsExprParts = this.scope.suggestionsExpr.split(/ in /i);

	
	var self = this;
	
	this.keydown = function(event) {
		console.log("KEY DOWN");
	};
	
	this.blur = function() {
		console.log("BLUR");
	};
	
	this.focus = function() {
		console.log("FOCUS");
	};
	
	this.searchSuggestions = function(previousSearchText) {
		var searchText = this.scope.searchText || '';
console.log('@@@@@@@ searchSuggestions ' + previousSearchText + " <> " + searchText + "   " + this.scope.minChars);		
		if (searchText!=previousSearchText) {
			if (searchText.length>=this.scope.minChars) {
				console.log("SEARCH_SUGGESTIONS " + this.scope.searchText);
				var suggestionsPromise = this.scope.$parent.$eval(this.suggestionsExprParts[1]);
				
				suggestionPromiseProcessing = true;
				
				this.asyncExecutor(function() {
					if (suggestionsPromise.success) suggestionsPromise.success(processSuggestionResults);
					if (suggestionsPromise.then)    suggestionsPromise.then(processSuggestionResults);
					if (suggestionsPromise.finally) suggestionsPromise.finally(function () {
						suggestionPromiseProcessing = false;
					});
				});
			} else {
				this.suggestions = [];
			}
		}
	};
	
	this.triggerSearchSuggestions = function(searchText, previousSearchText) {
		$timeout.cancel(self.timer);
		self.timer = $timeout(function() {
			self.timer = null;
			self.searchSuggestions(previousSearchText);
		}, 150, null);		
	};
	
	this.asyncExecutor = function(callback) {
		var asyncExecutorFct = this.asyncExecutor;
		var timeout = asyncExecutorFct.timeout;
		var queue = asyncExecutorFct.queue || [];
		queue.push(callback);

		asyncExecutorFct.digest |= true;
		asyncExecutorFct.queue = queue;

		return timeout || (asyncExecutorFct.timeout = $timeout(executor, 0, false));

		function executor() {
			var skip = self.scope && self.scope.$$destroyed;
			var queue = !skip ? asyncExecutorFct.queue : [];
			var digest = !skip ? asyncExecutorFct.digest : null;

			asyncExecutorFct.queue = [];
			asyncExecutorFct.timeout = null;
			asyncExecutorFct.digest = false;

			queue.forEach(function(callback) {
			  callback();
			});

			$rootScope.$digest();
		}
	};

	
    this.scope.$watch('searchText', this.triggerSearchSuggestions);
}


function ChipsAutocomplete() {
	return {
		controller: 'AutocompleteController',
		controllerAs: '$ctrl',
		scope: {
			id: '@?id',
			placeholder: '@placeholder',
			minChars: '=minchars',
			searchText: '=searchtext',
			suggestionsExpr: '@suggestions'
		},
		template: function (element, attr) {
			var tabIndex = attr.tabIndex;
			return '\
				<div class="autocomplete-container">\
					<input 	type="search" ' + (tabIndex != null ? 'tabindex="' + tabIndex + '"' : '') + '\
							id="{{id}}"\
							autocomplete="off"\
							ng-required="$ctrl.isRequired"\
							ng-disabled="$ctrl.isDisabled"\
							ng-model="$ctrl.scope.searchText"\
							ng-keydown="$ctrl.keydown($event)"\
							ng-blur="$ctrl.blur()"\
							ng-focus="$ctrl.focus()"\
							placeholder="{{placeholder}}"\
					/>\
                </div>';
		}
	};
}
