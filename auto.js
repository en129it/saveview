angular.module("MyRegistry", ['ngRoute', 'ngMaterial'])
.service('MyService', MyService)
.controller('MyController', MyController)
.controller('MyAccountController', MyAccountController)
.controller('AutocompleteController', AutocompleteController)
.controller('TextHighlighterController', TextHighlighterController)
.controller('AutocompleteChipsController', AutocompleteChipsController)
.directive('chipsAutocomplete', ChipsAutocomplete)
.directive('textHighlighter', TextHighlighter)
.directive('autocompleteChips', AutocompleteChips)
;

/*

<chips-autocomplete placeholder="Here..." 
					minchars="3" 
					searchtext="searchText" 
					suggestions="myCont.getMatches(searchText)" 
					selected-suggestion="myCont.selectedSuggestion">
	<suggestion-item-template>
		<div>
			<div>Suggestion</div>
			<div><text-highlighter text="searchText">{{suggestionItem}}</text-highlighter></div>
		</div>
	</suggestion-item-template>
</chips-autocomplete>


.selected {
	background-color: blue;
}

.highlight{
	font-weight: bold;
}

.autocomplete-suggestions-container {
	max-height: 140px;
	overflow-x: hidden;
	overflow-y: scroll;
	position: relative;
	top: 0px;
	left: 0px;
	right: 0px;
	bottom: auto;
	z-index:999;
	background-color: #cacaca;
}

.autocomplete-suggestions-scroller {
	position: relative;
	top: 0px;
	left: 0px;
	right: 0px;
}

*/

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
	this.isUserInSuggestionArea = false;
	this.suggestionContainerElem = null;
	this.suggestionScrollerElem = null;
	
	this.scope.searchText = "";

	
	var self = this;
	
	this.keydown = function(event) {
		switch (event.keyCode) {
		  case 40: // key down arrow
			event.stopPropagation();
			event.preventDefault();
			if (!this.hideSuggestions) {
				this.selectedSuggestionIndex += 1;
				if (this.selectedSuggestionIndex>=this.suggestions.length) {
					this.selectedSuggestionIndex = 0;
				}
				this.scrollToSelectedSuggestion();
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
				this.scrollToSelectedSuggestion();
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
			this.isUserInSuggestionArea = false;
			this.blur();
			this.clearAll();
			break;
		}
	};
	
	this.blur = function() {
		console.log("BLUR");
		if (!this.isUserInSuggestionArea) {
			this.closeSugggestions();
		}
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
		this.isUserInSuggestionArea = false;
		this.inputElem.focus();
		this.hideSuggestions = true;

	};
	
	this.suggestionsEnter = function() {
		this.isUserInSuggestionArea = true;
	}
	
	this.clearAll = function() {
		this.scope.searchText = "";
		this.suggestions = [];
		this.selectedSuggestionIndex = -1;
	};
	
	this.searchSuggestions = function(previousSearchText) {
		var searchText = this.scope.searchText || '';
		this.hideSuggestions = true;
		this.selectedSuggestionIndex = -1;
		
		if (searchText!=previousSearchText) {
			if (searchText.length>=this.scope.minChars) {
				var suggestionsPromise = this.scope.$parent.$eval(this.scope.suggestionsExpr);
				
				suggestionPromiseProcessing = true;
				
				this.asyncExecutor(function() {
					if (suggestionsPromise.then) {
						suggestionsPromise.then(function(results){
							if (searchText==self.scope.searchText) {
								self.suggestions = results;
								self.hideSuggestions = (results==null) || (results.length==0);
								if (!self.hideSuggestions) {
									self.asyncExecutor(function() {
										self.suggestionContainerElem.scrollTop=0;
									});

								}
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
	
	this.scrollToSelectedSuggestion = function() {

		var liElems = $element.find('li', this.suggestionScrollerElem);
		if (liElems.length>0) {
			var liElemHeight = liElems[0].offsetHeight;

			var scrollerElemTop = this.suggestionContainerElem.scrollTop;
			var selectedLiElemTop = this.selectedSuggestionIndex * liElemHeight;
			if (selectedLiElemTop<scrollerElemTop) {
				this.suggestionContainerElem.scrollTop=selectedLiElemTop;
			} else {
				var scrollerElemHeight = this.suggestionContainerElem.clientHeight;
				if ((selectedLiElemTop+liElemHeight)>(scrollerElemTop+scrollerElemHeight)) {
					this.suggestionContainerElem.scrollTop=selectedLiElemTop+liElemHeight-scrollerElemHeight;
				}
			}
		}
	};
	
    this.scope.$watch('searchText', this.triggerSearchSuggestions);
	
	this.inputElem = $element.find('input')[0];
	this.suggestionContainerElem = $element[0].getElementsByClassName('autocomplete-suggestions-container')[0];
	this.suggestionScrollerElem = $element[0].getElementsByClassName('autocomplete-suggestions-scroller')[0];
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
			var suggestionTemplate = element.find('suggestion-item-template').detach().html();
			
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
					  ng-mouseenter="$ctrl.suggestionsEnter()"\
					  ng-mouseleave="$ctrl.closeSugggestions()"\
					  ng-mouseup="$ctrl.closeSugggestions()"\
					  ng-hide="$ctrl.hideSuggestions">\
						<div class="autocomplete-suggestions-scroller">\
						<div class="sizer">\
							<ul class="autocomplete-suggestions">\
								<li ng-repeat="suggestionItem in $ctrl.suggestions"\
									ng-class="{selected: $index==$ctrl.selectedSuggestionIndex}"\
									ng-click="$ctrl.selectSuggestion($index)">\
					' + suggestionTemplate +			
						'		</li>\
							</ul>\
						</div>\
						</div>\
					</div>\
                </div>';
		}
	};
}

function TextHighlighterController($scope, $element, $attrs) {
	
	this.apply = function(textExpr, innerContentInterpolate) {
		var isFirst = true;
		$scope.$watch(
			function($scope) {
			  return {
				text: textExpr($scope),
				innerContent: innerContentInterpolate($scope)
			  };
			}, 
			function (newScopeState, oldScopeState) {
				if (isFirst || (newScopeState.text!==oldScopeState.text) || (newScopeState.innerContent!=oldScopeState.innerContent)) {
					isFirst = false;
					var adjustedInnterContent = newScopeState.innerContent.replace(new RegExp(newScopeState.text, 'i'), '<span class="highlight">$&</span>');
					$element.html(adjustedInnterContent);
				}
			}, 
			true);
	};
}

function TextHighlighter($interpolate, $parse) {
	return {
		terminal: true,
		controller: 'TextHighlighterController',
		compile: function textHighlighterCompile(tElement, tAttr) {
			var textExpr = $parse(tAttr.text);
			var innerContentInterpolate = $interpolate(tElement.html());
			return {
				post: function (scope, element, attr, ctrl) {
					ctrl.apply(textExpr, innerContentInterpolate);
				}
			};
		}
    };
}

function AutocompleteChipsController($scope, $element, $attrs) {
//	this.chips = $scope.datasource;
	this.chips = ['a', 'b'];
}

function AutocompleteChips($interpolate, $parse) {
	return {
		controller: 'AutocompleteChipsController',
		controllerAs: '$ctrl',
		scope: {
			datasource: '@datasource'
		},
		template: function (element, attr) {
			var chipTemplate = element.find('chip-item-template').detach().html();
			return '\
				<div class="autocomplete-chips-container">\
					<ul>\
						<li ng-repeat="chip in $ctrl.chips">\
			' + chipTemplate +			
						'</li>\
					</ul>\
                </div>';
		}
    };
}

