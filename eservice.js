function View(id, label, description, isPredefinedView) {
	this.id = id;
	this.label = label;
	this.description = description;
	this.isPredefinedView = isPredefinedView;
}

View.prototype.getId = function() {
	return this.id;
}

View.prototype.getLabel = function() {
	return this.label;
}

View.prototype.getDescription = function() {
	return this.description;
}

View.prototype.getIsPredefinedView = function() {
	return this.isPredefinedView;
}
var MyService = (function () {
	function MyService() {
		this.views = new Array();
		
		this.initViews = function() {
			this.views.push(new View(1, 'XXX default view', 'Default starting view provided by XXX', true));
			this.views.push(new View(2, 'XXX default view for smartphones', 'Default starting view provided by XXX customized for low resolution screen devices', true));
			this.views.push(new View(3, 'Support default view', 'Default starting view provided by XXX customized for supporting purpose', true));

			this.views.push(new View(4, 'Last month trades', 'Tracking of trades created last month', false));
			this.views.push(new View(5, 'Trades for customer ABC', 'Tracking of trades created for customer ABC', false));
			this.views.push(new View(6, 'Pending trades', 'Tracking of pending trades', false));
		};

		this.getViews = function() {
			return this.views;
		}
		
		this.initViews();
		
	}
	return MyService;
})();
