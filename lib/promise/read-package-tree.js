"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (pathToRoot, filter = (node, kidName) => kidName) {
    return new Promise((resolve, reject) => {
        (0, _readPackageTree2.default)(pathToRoot, filter, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

var _readPackageTree = require("read-package-tree");

var _readPackageTree2 = _interopRequireDefault(_readPackageTree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm9taXNlL3JlYWQtcGFja2FnZS10cmVlLmpzIl0sIm5hbWVzIjpbInBhdGhUb1Jvb3QiLCJmaWx0ZXIiLCJub2RlIiwia2lkTmFtZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZXJyIiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O2tCQUVlLFVBQVVBLFVBQVYsRUFBc0JDLFNBQVMsQ0FBQ0MsSUFBRCxFQUFPQyxPQUFQLEtBQW1CQSxPQUFsRCxFQUEyRDtBQUN0RSxXQUFPLElBQUlDLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDcEMsdUNBQUlOLFVBQUosRUFBZ0JDLE1BQWhCLEVBQXdCLENBQUNNLEdBQUQsRUFBTUMsSUFBTixLQUFlO0FBQ25DLGdCQUFJRCxHQUFKLEVBQVM7QUFDTEQsdUJBQU9DLEdBQVA7QUFDSCxhQUZELE1BRU87QUFDSEYsd0JBQVFHLElBQVI7QUFDSDtBQUNKLFNBTkQ7QUFPSCxLQVJNLENBQVA7QUFTSCxDOztBQVpEIiwiZmlsZSI6InJlYWQtcGFja2FnZS10cmVlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHJwdCBmcm9tIFwicmVhZC1wYWNrYWdlLXRyZWVcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHBhdGhUb1Jvb3QsIGZpbHRlciA9IChub2RlLCBraWROYW1lKSA9PiBraWROYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcnB0KHBhdGhUb1Jvb3QsIGZpbHRlciwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbiJdfQ==