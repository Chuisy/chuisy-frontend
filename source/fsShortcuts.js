window.fsShortcuts = {
    upload: function(source, target, fileKey, fileName, mimeType, success, failure, progress) {
        try {
            var options = new FileUploadOptions();
            options.fileKey = fileKey;
            options.fileName = fileName;
            options.mimeType = mimeType;

            var ft = new FileTransfer();
            ft.onprogress = function(event) {
                console.log("Upload progress: " + JSON.stringify(event));
                if (progress) {
                    progress(event);
                }
            };
            ft.upload(source, target, function(r) {
                console.log("upload successfull! " + JSON.stringify(r));
                if (success) {
                    success(r.response);
                }
            }, function(error) {
                console.error("File upload failed! " + error);
                if (failure) {
                    failure(error);
                }
            }, options);
        } catch (e) {
            console.error("Could not start file upload. " + e.message);
            if (failure) {
                failure(e);
            }
        }
    },
    download: function(source, targetDir, targetFileName, success, failure) {
        try {
            fsShortcuts.getDir(targetDir, function(directory) {
                var target = directory.fullPath + "/" + targetFileName;
                var ft = new FileTransfer();
                var uri = encodeURI(source);

                ft.download(uri, target, function(entry) {
                    console.log("Download complete: " + entry.fullPath);
                    if (success) {
                        success("file://" + entry.fullPath);
                    }
                }, function(error) {
                    console.error("File download failed! " + error);
                });
            });
        } catch (e) {
            console.error("Could not start file download. " + e);
        }
    },
    getDir: function(relPath, success, failure) {
        try {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSys) {
                fileSys.root.getDirectory(relPath, {create:true, exclusive: false}, function(directory) {
                    if (success) {
                        success(directory);
                    }
                }, function(error) {
                    console.error("Could not get directory. " + error);
                });
            }, function(error) {
                console.error("Could not get file system. " + error);
            });
        } catch (e) {
            console.error("Could not get directory. " + e);
        }
    },
    moveFile: function(source, targetDir, targetFileName, success, failure) {
        try {
            window.resolveLocalFileSystemURI(source, function(entry) {
                fsShortcuts.getDir(targetDir, function(directory) {
                    entry.copyTo(directory, targetFileName, function(entry) {
                        if (success) {
                            success("file://" + entry.fullPath);
                        }
                    }, function(error) {
                        console.error("Could not copy file. " + JSON.stringify(error));
                    });
                });
            }, function(error) {
                console.error("Could not resolve source uri. " + JSON.stringify(error));
            });
        } catch (e) {
            console.error("Could not resolve source uri. " + e.message);
            if (failure) {
                failure(e);
            }
        }
    },
    saveImageFromData: function(data, relTargetPath, success, failure) {
        try {
            var match = data.match(/^data:image\/(png|jpg);base64,(.+)$/);
            var format = match[1];
            var plainData = match[2];
            window.plugins.imageResizer.storeImage(function(fullPath) {
                if (success) {
                    success("file://" + fullPath);
                }
            }, function(error) {
                console.error("Could not save image. " + error);
            }, plainData, {filename: relTargetPath, format: format});
        } catch(e) {
            console.error("Could not save image. " + e);
        }
    },
    removeFile: function(url, success, failure) {
        try {
            window.resolveLocalFileSystemURI(url, function(entry) {
                entry.remove(function() {
                    console.log("File removed successfully: " + entry.fullPath);
                    if (success) {
                        success();
                    }
                }, function(error) {
                    console.error("Failed to remove file at " + entry.fullPath + ". " + error);
                });
            }, function(error) {
                console.error("Could not resolve url " + error);
            });
        } catch(e) {
            console.error("Failed to remove file at " + url + ". " + e);
        }
    }
};