"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (pathToRoot, strict = false) {
    return new Promise((resolve, reject) => {
        rpj(pathToRoot, strict, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

var rpj = require("read-package-json");
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm9taXNlL3JlYWQtcGFja2FnZS1qc29uLmpzIl0sIm5hbWVzIjpbInBhdGhUb1Jvb3QiLCJzdHJpY3QiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInJwaiIsImVyciIsImRhdGEiLCJyZXF1aXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7a0JBRWUsVUFBVUEsVUFBVixFQUFzQkMsU0FBUyxLQUEvQixFQUFzQztBQUNqRCxXQUFPLElBQUlDLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDcENDLFlBQUlMLFVBQUosRUFBZ0JDLE1BQWhCLEVBQXdCLENBQUNLLEdBQUQsRUFBTUMsSUFBTixLQUFlO0FBQ25DLGdCQUFJRCxHQUFKLEVBQVM7QUFDTEYsdUJBQU9FLEdBQVA7QUFDSCxhQUZELE1BRU87QUFDSEgsd0JBQVFJLElBQVI7QUFDSDtBQUNKLFNBTkQ7QUFPSCxLQVJNLENBQVA7QUFTSCxDOztBQVpELElBQUlGLE1BQU1HLFFBQVEsbUJBQVIsQ0FBViIsImZpbGUiOiJyZWFkLXBhY2thZ2UtanNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBycGogPSByZXF1aXJlKFwicmVhZC1wYWNrYWdlLWpzb25cIik7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChwYXRoVG9Sb290LCBzdHJpY3QgPSBmYWxzZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHJwaihwYXRoVG9Sb290LCBzdHJpY3QsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4iXX0=