requirejs.config({
	shim: {
		"path.min": {
			exports: "Path"
		}
	},
	paths: {
		jquery: "http://code.jquery.com/jquery-1.9.1.min",
		jquerymobile: "http://code.jquery.com/mobile/1.3.0/jquery.mobile-1.3.0",
		path: "path.min",
		knockout: "http://ajax.aspnetcdn.com/ajax/knockout/knockout-2.2.1",
		moment: "moment.min",
		jquerycookie: "jquery.cookie"
	}
});

requirejs(["require", "jquery"], function (require, $) {
	$(window).one("mobileinit", function () {
		$.extend($.mobile, {
			"linkBindingEnabled": false,
			"hashListeningEnabled": false,
			"ajaxEnabled": false,
			"pushStateEnabled": false
		});
	});
	require(["router", "jquerymobile"], function (r) {
		r.start();
	});
});
