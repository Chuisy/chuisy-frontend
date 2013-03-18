describe("fsShortcuts", function() {
	var filePath;

	describe("getDir", function() {
		it("should call the success callback with a valid directory", function() {
			var success = jasmine.createSpy();
			var failure = jasmine.createSpy();

			runs(function() {
				fsShortcuts.getDir("/", success, failure);
			});

			waitsFor(function() {
				return success.callCount || failure.callCount;
			});

			runs(function() {
				expect(success).toHaveBeenCalled();
				var dir = success.mostRecentCall.args[0];
				expect(dir instanceof DirectoryEntry).toBeTruthy();
				expect(dir.fullPath).toMatch(/(\/.+)+\/?/);
				expect(dir.isDirectory).toBeTruthy();
				expect(dir.name).toEqual("Documents");
				expect(failure).not.toHaveBeenCalled();
			});
		});
	});

	describe("saveImageFromData", function() {
		var dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEgAACxIB0t1+/AAAAAd0SU1FB9EFBAoYMhVvMQIAAAAtSURBVHicY/z//z8DHoBH+v///yy4FDEyMjIwMDDhM3lgpaEuh7gTEzDiDxYA9HEPDF90e5YAAAAASUVORK5CYII=";
		it("should save the image to the right directory with the right filename", function() {
			var success = jasmine.createSpy();
			var failure = jasmine.createSpy();

			runs(function() {
				fsShortcuts.saveImageFromData(dataUrl, "test/test.png", success, failure);
			});

			waitsFor(function() {
				return success.callCount || failure.callCount;
			});

			runs(function() {
				filePath = success.mostRecentCall.args[0];
				expect(filePath).toMatch(/Documents\/test\/test.png$/);
			});
		});
	});

	describe("download", function() {
		it("should download the requested file", function() {
			var success = jasmine.createSpy();
			var failure = jasmine.createSpy();

			runs(function() {
				fsShortcuts.download("https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg", "test/", "example.jpg", success, failure);
			});

			waitsFor(function() {
				return success.callCount || failure.callCount;
			});

			runs(function() {
				expect(success).toHaveBeenCalled();
				expect(failure).not.toHaveBeenCalled();
				filePath = success.mostRecentCall.args[0];
				expect(filePath).toMatch(/Documents\/test\/example.jpg$/);
			});
		});
	});

	xdescribe("moveFile", function() {
		fsShortcuts.removeFile("file:///Users/martin/Library/Application Support/iPhone Simulator/6.1/Applications/99DFCEDA-777C-47B5-8873-6F6F6F79E65A/Documents/test2/test2.jpg");
		it("should move the file to the right directory with the right filename", function() {
			var success = jasmine.createSpy();
			var failure = jasmine.createSpy();

			runs(function() {
				fsShortcuts.moveFile(filePath, "test2/", "test2.jpg", success, failure);
			});

			waitsFor(function() {
				return success.callCount || failure.callCount;
			});

			runs(function() {
				expect(success).toHaveBeenCalled();
				expect(failure).not.toHaveBeenCalled();
				filePath = success.mostRecentCall.args[0];
				expect(filePath).toMatch(/Documents\/test2\/test2.jpg$/);
			});
		});
	});

	describe("removeFile", function() {
		it("should call the success callback", function() {
			var success = jasmine.createSpy();
			var failure = jasmine.createSpy();

			runs(function() {
				fsShortcuts.removeFile(filePath, success, failure);
			});

			waitsFor(function() {
				return success.callCount || failure.callCount;
			});

			runs(function() {
				expect(success).toHaveBeenCalled();
				expect(failure).not.toHaveBeenCalled();
			});
		});
	});
});