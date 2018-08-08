import mkdirp from 'mkdirp';
import formidable from 'formidable';
import objectPath from 'object-path';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function processRequest(request, { uploadDir } = {}) {
  // Ensure provided upload directory exists
  if (uploadDir) mkdirp.sync(uploadDir);

  const form = formidable.IncomingForm({
    // Defaults to the OS temp directory
    uploadDir
  });

  // Parse the multipart form request
  return new Promise((resolve, reject) => {
    form.parse(request, (error, { operations }, files) => {
      if (error) reject(new Error(error));

      // Decode the GraphQL operation(s). This is an array if batching is
      // enabled.
      operations = JSON.parse(operations);

      // Check if files were uploaded
      if (Object.keys(files).length) {
        // File field names contain the original path to the File object in the
        // GraphQL operation input variables. Relevent data for each uploaded
        // file now gets placed back in the variables.
        const operationsPath = objectPath(operations);
        Object.keys(files).forEach(variablesPath => {
          var _files$variablesPath = files[variablesPath];
          const name = _files$variablesPath.name,
                type = _files$variablesPath.type,
                size = _files$variablesPath.size,
                path = _files$variablesPath.path;

          operationsPath.set(variablesPath, { name, type, size, path });
        });
      }

      // Provide fields for replacement request body
      resolve(operations);
    });
  });
}

function apolloUploadKoa(options) {
  return (() => {
    var _ref = _asyncToGenerator(function* (ctx, next) {
      // Skip if there are no uploads
      if (ctx.request.is('multipart/form-data')) ctx.request.body = yield processRequest(ctx.req, options);
      yield next();
    });

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })();
}

function apolloUploadExpress(options) {
  return (request, response, next) => {
    // Skip if there are no uploads
    if (!request.is('multipart/form-data')) return next();
    processRequest(request, options).then(body => {
      request.body = body;
      next();
    });
  };
}

export { processRequest, apolloUploadKoa, apolloUploadExpress };
//# sourceMappingURL=apollo-upload-server.module.js.map
