describe("util", function() {
	describe("timeToText", function() {
		// Fake the translate function of the g11n module
		window.$L = function(string) {
			return string;
		};

		var now;
		beforeEach(function() {
			now = new Date();
		});

		it("should return 'just now' if the time is undefined", function() {
			expect(util.timeToText()).toEqual("just now");
		});

		it("should return 'just now' if the time is less than one minute past", function() {
			var time = new Date(now.getTime() - 59 * 1000);
			expect(util.timeToText(time)).toEqual('just now');
		});

		it("should return 'x minutes ago' if the time is less than one hour past", function() {
			var time = new Date(now.getTime() - 59 * 60 * 1000);
			expect(util.timeToText(time)).toEqual('59 minutes ago');
		});

		it("should return 'x hours ago' if the time is less than one day past", function() {
			var time = new Date(now.getTime() - 23 * 60 * 60 * 1000);
			expect(util.timeToText(time)).toEqual('23 hours ago');
		});

		it("should return 'x days ago' if the time is less than 30 days past", function() {
			var time = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
			expect(util.timeToText(time)).toEqual('29 days ago');
		});

		it("should return 'a while back...' if the time is more than 30 days past", function() {
			var time = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
			expect(util.timeToText(time)).toEqual('a while back...');
		});
	});

	describe("createThumbnail", function() {
		it("should return a valid data url", function() {
			var callback = jasmine.createSpy();
			runs(function() {
				util.createThumbnail("assets/test.png", 100, 100, callback);
			});
			waitsFor(function() {
				return callback.callCount;
			});
			runs(function() {
				var dataUrl = callback.mostRecentCall.args[0];
				expect(dataUrl).toMatch(/data:image\/png;base64/);
			});
		});
	});
});