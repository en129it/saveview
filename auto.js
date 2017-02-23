angular.module("MyRegistry", ['ngRoute', 'ngMaterial'])
.service('MyService', MyService)
.controller('MyController', MyController)
.controller('MyAccountController', MyAccountController)
.controller('AutocompleteController', AutocompleteController)
.directive('chipsAutocomplete', ChipsAutocomplete)
;

// Usage : <chips-autocomplete placeholder="Here..." minchars="3" searchtext="searchText" suggestions="item in myCont.getMatches(searchText)"></chips-autocomplete>


/* @nginject */
function AutocompleteController($scope, $element, $mdUtil, $mdConstant, $mdTheming, $window, $animate, $rootElement, $attrs, $q, $timeout, $rootScope) {
	this.isRequired = true;
	this.isDisabled = false;
	this.scope = $scope;
	this.timer = null;
	this.suggestions = [];
	this.suggestionPromiseProcessing = false;
	this.hideSuggestions = true;
	this.selectedSuggestionIndex = -1;
	this.inputElem = null;
	
	this.scope.searchText = "";
	this.suggestionsExprParts = this.scope.suggestionsExpr.split(/ in /i);

	
	var self = this;
	
	this.keydown = function(event) {
		switch (event.keyCode) {
		  case 40: // key down arrow
			event.stopPropagation();
			event.preventDefault();
			if (!this.hideSuggestions) {
				this.selectedSuggestionIndex += 1;
				if (this.selectedSuggestionIndex>this.suggestions.length) {
					this.selectedSuggestionIndex = 0;
				}
			}
			break;
		  case 38: // key up arrow
			event.stopPropagation();
			event.preventDefault();
			if (!this.hideSuggestions) {
				this.selectedSuggestionIndex -= 1;
				if (this.selectedSuggestionIndex<0) {
					this.selectedSuggestionIndex = this.suggestions.length-1;
				}
			}
			break;
		  case 13: // key enter
			if ((!this.hideSuggestions) && (this.selectedSuggestionIndex>-1)) {
				event.stopPropagation();
				event.preventDefault();
				this.selectSuggestion(this.selectedSuggestionIndex);
			}
			break;
		  case 27: // key esc
			event.stopPropagation();
			event.preventDefault();
			this.clearAll();
			break;
		}
	};
	
	this.blur = function() {
		console.log("BLUR");
	};
	
	this.focus = function() {
		console.log("FOCUS");
	};
	
	this.selectSuggestion = function(index) {
		this.asyncExecutor(function () {
			self.scope.selectedSuggestion = self.suggestions[index];
console.log(">>>>>> select suggestion " + self.suggestions[index]);
			self.clearAll();
		});
	};

	this.closeSugggestions = function() {
		this.inputElem.focus();
		this.hideSuggestions = true;
	};
	
	this.clearAll = function() {
		this.scope.searchText = "";
		this.suggestions = [];
		this.selectedSuggestionIndex = -1;
	};
	
	this.searchSuggestions = function(previousSearchText) {
		var searchText = this.scope.searchText || '';
		if (searchText!=previousSearchText) {
			if (searchText.length>=this.scope.minChars) {
				console.log("SEARCH_SUGGESTIONS " + this.scope.searchText);
				var suggestionsPromise = this.scope.$parent.$eval(this.suggestionsExprParts[1]);
				
				suggestionPromiseProcessing = true;
				
				this.asyncExecutor(function() {
					if (suggestionsPromise.then) {
						suggestionsPromise.then(function(results){
							if (searchText==self.scope.searchText) {
								self.suggestions = results;
								self.hideSuggestions = (results==null) || (results.length==0);
							}
						});
					}
					if (suggestionsPromise.finally) {
						suggestionsPromise.finally(function() {
							suggestionPromiseProcessing = false;
						});
					}
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
	this.inputElem = $element.find('input')[0];
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
			suggestionsExpr: '@suggestions',
			selectedSuggestion: '=selectedSuggestion'
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
					<div class="autocomplete-suggestions-container"\
					  ng-mouseenter="$ctrl.listEnter()"\
					  ng-mouseleave="$ctrl.closeSugggestions()"\
					  ng-mouseup="$ctrl.closeSugggestions()"\
					  ng-hide="$ctrl.showSuggestions">\
						<ul class="autocomplete-suggestions">\
							<li ng-repeat="item in $ctrl.suggestions"\
								ng-class="{selected: $index==$ctrl.selectedSuggestionIndex}"\
								ng-click="$ctrl.selectSuggestion($index)">\
							{{item}}\
							</li>\
						</ul>\
					</div>\
                </div>';
		}
	};
}
