"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.__test__ = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _gitUrlParse = require("git-url-parse");

var _gitUrlParse2 = _interopRequireDefault(_gitUrlParse);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rest = require("@octokit/rest");

var _rest2 = _interopRequireDefault(_rest);

var _package = require("../package.json");

var _package2 = _interopRequireDefault(_package);

var _compare = require("./compare");

var _readPackageTree = require("./promise/read-package-tree");

var _readPackageTree2 = _interopRequireDefault(_readPackageTree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toTag(tags, version) {
    let v = `v${version}`;
    if (tags.has(v)) {
        return v;
    }
    return tags.has(version) && version;
}

function diffURL(cm, to) {
    if (cm.repo) {
        if (cm.current === to) {
            let tag = toTag(cm.tags, cm.current);
            return tag && `${cm.repo}/tree/${tag}`;
        }
        let ft = toTag(cm.tags, cm.current);
        let tt = toTag(cm.tags, to);
        return ft && tt && `${cm.repo}/compare/${ft}...${tt}`;
    }
    return "";
}

function versionRange(current, to) {
    if (current === to) {
        return current;
    }
    return `${current}...${to}`;
}

class CompareModel {
    constructor(a) {
        var _a = _slicedToArray(a, 5);

        this.name = _a[0];
        this.current = _a[1];
        this.wanted = _a[2];
        this.latest = _a[3];
        this.packageType = _a[4];

        this.repo = "";
        this.homepage = "";
        this.tags = new Set();
    }

    rangeWanted() {
        return versionRange(this.current, this.wanted);
    }

    rangeLatest() {
        return versionRange(this.current, this.latest);
    }

    diffWantedURL() {
        return diffURL(this, this.wanted);
    }

    diffLatestURL() {
        return diffURL(this, this.latest);
    }
}

function selectGetTagsPromise(LOG, github, c) {
    let handler = (prev, res) => {
        let tags = prev.concat(res.data.map(t => t.ref.split("/")[2]));
        if (github.hasNextPage(res)) {
            return github.getNextPage(res).then(r => handler(tags, r));
        }
        return tags;
    };
    if (c.repo) {
        let url = (0, _gitUrlParse2.default)(c.repo);
        if (url.owner && url.name) {
            LOG(`BEGIN getTags from ${url.toString("https")}`);
            let request = { owner: url.owner, repo: url.name };
            return Promise.all([github.gitdata.getTags(request).then(res => handler([], res))]).then(([tags]) => {
                LOG(`END   getTags ${tags}`);
                c.tags = new Set(tags);
                return c;
            }, err => {
                LOG(`END   getTags ${request} ${err}`);
                return c;
            });
        }
    }
    return Promise.resolve(c);
}

function reconcile(LOG, github, dep, c) {
    LOG(`BEGIN reconcile CompareModel ${c.name}`);
    c.homepage = dep.homepage;
    if (dep.repository) {
        if (dep.repository.url) {
            let u = (0, _gitUrlParse2.default)(dep.repository.url);
            c.repo = u && u.toString("https").replace(/\.git$/, "");
        }
        if (_lodash2.default.isString(dep.repository) && 2 === dep.split("/")) {
            c.repo = `https://github.com/${dep.repository}`;
        }
    }
    return c.shadow ? Promise.resolve(c) : selectGetTagsPromise(LOG, github, c).then(c => {
        LOG(`END   reconcile CompareModel ${c.name}`);
        return c;
    });
}

function toCompareModels(LOG, github, cwd, diff) {
    let map = new Map(diff.map(d => {
        let c = new CompareModel(d);
        return [c.name, c];
    }));
    LOG("BEGIN read-package-tree");
    return (0, _readPackageTree2.default)(cwd, (n, k) => map.get(k)).then(data => {
        LOG("END   read-package-tree");
        let ps = data.children.map(e => reconcile(LOG, github, e.package, map.get(e.package.name)));
        return Promise.all(ps).then(() => map);
    });
}

// for tesing purpose
const __test__ = exports.__test__ = [CompareModel, diffURL, toTag, versionRange];

exports.default = class {
    constructor(options, remote) {
        this.options = options;
        this.LOG = options.logger;
        this.url = (0, _gitUrlParse2.default)(remote);
        let ghopt = {
            headers: {
                "user-agent": `${_package2.default.name}/${_package2.default.version}`
            }
        };
        if (this.url.resource !== "github.com") {
            // for GHE
            ghopt.host = this.url.resource;
            ghopt.pathPrefix = "/api/v3";
        }
        this.original = new _rest2.default(ghopt);
        this.original.authenticate({
            type: "token", token: options.token
        });
    }

    pullRequest(baseBranch, newBranch, diff) {
        this.LOG(`prepare PullRequest ${this.url.toString("https")} ${baseBranch}...${newBranch}`);
        if (this.options.execute) {
            this.LOG("Create Markdown Report for PullRequest.");
            return toCompareModels(this.LOG, this.original, this.options.workingdir, diff).then(_compare.toMarkdown).then(view => {
                return {
                    owner: this.url.owner,
                    repo: this.url.name,
                    base: baseBranch,
                    head: newBranch,
                    title: `update dependencies at ${this.options.now}`,
                    body: view
                };
            }).then(value => {
                this.LOG("BEGIN Send PullRequest.");
                return this.original.pullRequests.create(value).then(body => {
                    this.LOG(`END   Send PullRequest. ${body.data.html_url}`);
                });
            });
        } else {
            this.LOG("Sending PullRequest is skipped because --execute is not specified.");
            return toCompareModels(this.LOG, this.original, this.options.workingdir, diff).then(_compare.toTextTable);
        }
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9naXRodWIuanMiXSwibmFtZXMiOlsidG9UYWciLCJ0YWdzIiwidmVyc2lvbiIsInYiLCJoYXMiLCJkaWZmVVJMIiwiY20iLCJ0byIsInJlcG8iLCJjdXJyZW50IiwidGFnIiwiZnQiLCJ0dCIsInZlcnNpb25SYW5nZSIsIkNvbXBhcmVNb2RlbCIsImNvbnN0cnVjdG9yIiwiYSIsIm5hbWUiLCJ3YW50ZWQiLCJsYXRlc3QiLCJwYWNrYWdlVHlwZSIsImhvbWVwYWdlIiwiU2V0IiwicmFuZ2VXYW50ZWQiLCJyYW5nZUxhdGVzdCIsImRpZmZXYW50ZWRVUkwiLCJkaWZmTGF0ZXN0VVJMIiwic2VsZWN0R2V0VGFnc1Byb21pc2UiLCJMT0ciLCJnaXRodWIiLCJjIiwiaGFuZGxlciIsInByZXYiLCJyZXMiLCJjb25jYXQiLCJkYXRhIiwibWFwIiwidCIsInJlZiIsInNwbGl0IiwiaGFzTmV4dFBhZ2UiLCJnZXROZXh0UGFnZSIsInRoZW4iLCJyIiwidXJsIiwib3duZXIiLCJ0b1N0cmluZyIsInJlcXVlc3QiLCJQcm9taXNlIiwiYWxsIiwiZ2l0ZGF0YSIsImdldFRhZ3MiLCJlcnIiLCJyZXNvbHZlIiwicmVjb25jaWxlIiwiZGVwIiwicmVwb3NpdG9yeSIsInUiLCJyZXBsYWNlIiwiXyIsImlzU3RyaW5nIiwic2hhZG93IiwidG9Db21wYXJlTW9kZWxzIiwiY3dkIiwiZGlmZiIsIk1hcCIsImQiLCJuIiwiayIsImdldCIsInBzIiwiY2hpbGRyZW4iLCJlIiwicGFja2FnZSIsIl9fdGVzdF9fIiwib3B0aW9ucyIsInJlbW90ZSIsImxvZ2dlciIsImdob3B0IiwiaGVhZGVycyIsInBrZyIsInJlc291cmNlIiwiaG9zdCIsInBhdGhQcmVmaXgiLCJvcmlnaW5hbCIsIkdpdEh1YiIsImF1dGhlbnRpY2F0ZSIsInR5cGUiLCJ0b2tlbiIsInB1bGxSZXF1ZXN0IiwiYmFzZUJyYW5jaCIsIm5ld0JyYW5jaCIsImV4ZWN1dGUiLCJ3b3JraW5nZGlyIiwidG9NYXJrZG93biIsInZpZXciLCJiYXNlIiwiaGVhZCIsInRpdGxlIiwibm93IiwiYm9keSIsInZhbHVlIiwicHVsbFJlcXVlc3RzIiwiY3JlYXRlIiwiaHRtbF91cmwiLCJ0b1RleHRUYWJsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUVBOzs7O0FBRUE7Ozs7QUFDQTs7QUFDQTs7Ozs7O0FBRUEsU0FBU0EsS0FBVCxDQUFlQyxJQUFmLEVBQXFCQyxPQUFyQixFQUE4QjtBQUMxQixRQUFJQyxJQUFLLElBQUdELE9BQVEsRUFBcEI7QUFDQSxRQUFJRCxLQUFLRyxHQUFMLENBQVNELENBQVQsQ0FBSixFQUFpQjtBQUNiLGVBQU9BLENBQVA7QUFDSDtBQUNELFdBQU9GLEtBQUtHLEdBQUwsQ0FBU0YsT0FBVCxLQUFxQkEsT0FBNUI7QUFDSDs7QUFFRCxTQUFTRyxPQUFULENBQWlCQyxFQUFqQixFQUFxQkMsRUFBckIsRUFBeUI7QUFDckIsUUFBSUQsR0FBR0UsSUFBUCxFQUFhO0FBQ1QsWUFBSUYsR0FBR0csT0FBSCxLQUFlRixFQUFuQixFQUF1QjtBQUNuQixnQkFBSUcsTUFBTVYsTUFBTU0sR0FBR0wsSUFBVCxFQUFlSyxHQUFHRyxPQUFsQixDQUFWO0FBQ0EsbUJBQU9DLE9BQVEsR0FBRUosR0FBR0UsSUFBSyxTQUFRRSxHQUFJLEVBQXJDO0FBQ0g7QUFDRCxZQUFJQyxLQUFLWCxNQUFNTSxHQUFHTCxJQUFULEVBQWVLLEdBQUdHLE9BQWxCLENBQVQ7QUFDQSxZQUFJRyxLQUFLWixNQUFNTSxHQUFHTCxJQUFULEVBQWVNLEVBQWYsQ0FBVDtBQUNBLGVBQU9JLE1BQU1DLEVBQU4sSUFBYSxHQUFFTixHQUFHRSxJQUFLLFlBQVdHLEVBQUcsTUFBS0MsRUFBRyxFQUFwRDtBQUNIO0FBQ0QsV0FBTyxFQUFQO0FBQ0g7O0FBRUQsU0FBU0MsWUFBVCxDQUFzQkosT0FBdEIsRUFBK0JGLEVBQS9CLEVBQW1DO0FBQy9CLFFBQUlFLFlBQVlGLEVBQWhCLEVBQW9CO0FBQ2hCLGVBQU9F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NUUsR0FBTCxDQUFTLG9FQUFUO0FBQ0EsbUJBQU9rQyxnQkFBZ0IsS0FBS2xDLEdBQXJCLEVBQTBCLEtBQUt3RCxRQUEvQixFQUF5QyxLQUFLVCxPQUFMLENBQWFrQixVQUF0RCxFQUFrRTdCLElBQWxFLEVBQ0Z0QixJQURFLENBQ0crRCxvQkFESCxDQUFQO0FBRUg7QUFDSjtBQS9DZ0IsQyIsImZpbGUiOiJnaXRodWIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZ2l0dXJsIGZyb20gXCJnaXQtdXJsLXBhcnNlXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5cbmltcG9ydCBHaXRIdWIgZnJvbSBcIkBvY3Rva2l0L3Jlc3RcIjtcblxuaW1wb3J0IHBrZyBmcm9tIFwiLi4vcGFja2FnZS5qc29uXCI7XG5pbXBvcnQgeyB0b01hcmtkb3duLCB0b1RleHRUYWJsZSB9IGZyb20gXCIuL2NvbXBhcmVcIjtcbmltcG9ydCBycHQgZnJvbSBcIi4vcHJvbWlzZS9yZWFkLXBhY2thZ2UtdHJlZVwiO1xuXG5mdW5jdGlvbiB0b1RhZyh0YWdzLCB2ZXJzaW9uKSB7XG4gICAgbGV0IHYgPSBgdiR7dmVyc2lvbn1gO1xuICAgIGlmICh0YWdzLmhhcyh2KSkge1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgcmV0dXJuIHRhZ3MuaGFzKHZlcnNpb24pICYmIHZlcnNpb247XG59XG5cbmZ1bmN0aW9uIGRpZmZVUkwoY20sIHRvKSB7XG4gICAgaWYgKGNtLnJlcG8pIHtcbiAgICAgICAgaWYgKGNtLmN1cnJlbnQgPT09IHRvKSB7XG4gICAgICAgICAgICBsZXQgdGFnID0gdG9UYWcoY20udGFncywgY20uY3VycmVudCk7XG4gICAgICAgICAgICByZXR1cm4gdGFnICYmIGAke2NtLnJlcG99L3RyZWUvJHt0YWd9YDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZnQgPSB0b1RhZyhjbS50YWdzLCBjbS5jdXJyZW50KTtcbiAgICAgICAgbGV0IHR0ID0gdG9UYWcoY20udGFncywgdG8pO1xuICAgICAgICByZXR1cm4gZnQgJiYgdHQgJiYgYCR7Y20ucmVwb30vY29tcGFyZS8ke2Z0fS4uLiR7dHR9YDtcbiAgICB9XG4gICAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIHZlcnNpb25SYW5nZShjdXJyZW50LCB0bykge1xuICAgIGlmIChjdXJyZW50ID09PSB0bykge1xuICAgICAgICByZXR1cm4gY3VycmVudDtcbiAgICB9XG4gICAgcmV0dXJuIGAke2N1cnJlbnR9Li4uJHt0b31gO1xufVxuXG5jbGFzcyBDb21wYXJlTW9kZWwge1xuICAgIGNvbnN0cnVjdG9yKGEpIHtcbiAgICAgICAgW3RoaXMubmFtZSwgdGhpcy5jdXJyZW50LCB0aGlzLndhbnRlZCwgdGhpcy5sYXRlc3QsIHRoaXMucGFja2FnZVR5cGVdID0gYTtcbiAgICAgICAgdGhpcy5yZXBvID0gXCJcIjtcbiAgICAgICAgdGhpcy5ob21lcGFnZSA9IFwiXCI7XG4gICAgICAgIHRoaXMudGFncyA9IG5ldyBTZXQoKTtcbiAgICB9XG5cbiAgICByYW5nZVdhbnRlZCgpIHtcbiAgICAgICAgcmV0dXJuIHZlcnNpb25SYW5nZSh0aGlzLmN1cnJlbnQsIHRoaXMud2FudGVkKTtcbiAgICB9XG5cbiAgICByYW5nZUxhdGVzdCgpIHtcbiAgICAgICAgcmV0dXJuIHZlcnNpb25SYW5nZSh0aGlzLmN1cnJlbnQsIHRoaXMubGF0ZXN0KTtcbiAgICB9XG5cbiAgICBkaWZmV2FudGVkVVJMKCkge1xuICAgICAgICByZXR1cm4gZGlmZlVSTCh0aGlzLCB0aGlzLndhbnRlZCk7XG4gICAgfVxuXG4gICAgZGlmZkxhdGVzdFVSTCgpIHtcbiAgICAgICAgcmV0dXJuIGRpZmZVUkwodGhpcywgdGhpcy5sYXRlc3QpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2VsZWN0R2V0VGFnc1Byb21pc2UoTE9HLCBnaXRodWIsIGMpIHtcbiAgICBsZXQgaGFuZGxlciA9IChwcmV2LCByZXMpID0+IHtcbiAgICAgICAgbGV0IHRhZ3MgPSBwcmV2LmNvbmNhdChyZXMuZGF0YS5tYXAodCA9PiB0LnJlZi5zcGxpdChcIi9cIilbMl0pKTtcbiAgICAgICAgaWYgKGdpdGh1Yi5oYXNOZXh0UGFnZShyZXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2l0aHViLmdldE5leHRQYWdlKHJlcykudGhlbihyID0+IGhhbmRsZXIodGFncywgcikpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YWdzO1xuICAgIH07XG4gICAgaWYgKGMucmVwbykge1xuICAgICAgICBsZXQgdXJsID0gZ2l0dXJsKGMucmVwbyk7XG4gICAgICAgIGlmICh1cmwub3duZXIgJiYgdXJsLm5hbWUpIHtcbiAgICAgICAgICAgIExPRyhgQkVHSU4gZ2V0VGFncyBmcm9tICR7dXJsLnRvU3RyaW5nKFwiaHR0cHNcIil9YCk7XG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IHsgb3duZXI6IHVybC5vd25lciwgcmVwbzogdXJsLm5hbWUgfTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgZ2l0aHViLmdpdGRhdGEuZ2V0VGFncyhyZXF1ZXN0KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4gaGFuZGxlcihbXSwgcmVzKSlcbiAgICAgICAgICAgIF0pLnRoZW4oKFt0YWdzXSkgPT4ge1xuICAgICAgICAgICAgICAgIExPRyhgRU5EICAgZ2V0VGFncyAke3RhZ3N9YCk7XG4gICAgICAgICAgICAgICAgYy50YWdzID0gbmV3IFNldCh0YWdzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICAgICAgTE9HKGBFTkQgICBnZXRUYWdzICR7cmVxdWVzdH0gJHtlcnJ9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGMpO1xufVxuXG5mdW5jdGlvbiByZWNvbmNpbGUoTE9HLCBnaXRodWIsIGRlcCwgYykge1xuICAgIExPRyhgQkVHSU4gcmVjb25jaWxlIENvbXBhcmVNb2RlbCAke2MubmFtZX1gKTtcbiAgICBjLmhvbWVwYWdlID0gZGVwLmhvbWVwYWdlO1xuICAgIGlmIChkZXAucmVwb3NpdG9yeSkge1xuICAgICAgICBpZiAoZGVwLnJlcG9zaXRvcnkudXJsKSB7XG4gICAgICAgICAgICBsZXQgdSA9IGdpdHVybChkZXAucmVwb3NpdG9yeS51cmwpO1xuICAgICAgICAgICAgYy5yZXBvID0gdSAmJiB1LnRvU3RyaW5nKFwiaHR0cHNcIikucmVwbGFjZSgvXFwuZ2l0JC8sIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzU3RyaW5nKGRlcC5yZXBvc2l0b3J5KSAmJiAyID09PSBkZXAuc3BsaXQoXCIvXCIpKSB7XG4gICAgICAgICAgICBjLnJlcG8gPSBgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGVwLnJlcG9zaXRvcnl9YDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYy5zaGFkb3cgPyBQcm9taXNlLnJlc29sdmUoYykgOiBzZWxlY3RHZXRUYWdzUHJvbWlzZShMT0csIGdpdGh1YiwgYykudGhlbihjID0+IHtcbiAgICAgICAgTE9HKGBFTkQgICByZWNvbmNpbGUgQ29tcGFyZU1vZGVsICR7Yy5uYW1lfWApO1xuICAgICAgICByZXR1cm4gYztcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdG9Db21wYXJlTW9kZWxzKExPRywgZ2l0aHViLCBjd2QsIGRpZmYpIHtcbiAgICBsZXQgbWFwID0gbmV3IE1hcChkaWZmLm1hcChkID0+IHtcbiAgICAgICAgbGV0IGMgPSBuZXcgQ29tcGFyZU1vZGVsKGQpO1xuICAgICAgICByZXR1cm4gW2MubmFtZSwgY107XG4gICAgfSkpO1xuICAgIExPRyhcIkJFR0lOIHJlYWQtcGFja2FnZS10cmVlXCIpO1xuICAgIHJldHVybiBycHQoY3dkLCAobiwgaykgPT4gbWFwLmdldChrKSkudGhlbihkYXRhID0+IHtcbiAgICAgICAgTE9HKFwiRU5EICAgcmVhZC1wYWNrYWdlLXRyZWVcIik7XG4gICAgICAgIGxldCBwcyA9IGRhdGEuY2hpbGRyZW4ubWFwKGUgPT4gcmVjb25jaWxlKExPRywgZ2l0aHViLCBlLnBhY2thZ2UsIG1hcC5nZXQoZS5wYWNrYWdlLm5hbWUpKSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcykudGhlbigoKSA9PiBtYXApO1xuICAgIH0pO1xufVxuXG4vLyBmb3IgdGVzaW5nIHB1cnBvc2VcbmV4cG9ydCBjb25zdCBfX3Rlc3RfXyA9IFtDb21wYXJlTW9kZWwsIGRpZmZVUkwsIHRvVGFnLCB2ZXJzaW9uUmFuZ2VdO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucywgcmVtb3RlKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuTE9HID0gb3B0aW9ucy5sb2dnZXI7XG4gICAgICAgIHRoaXMudXJsID0gZ2l0dXJsKHJlbW90ZSk7XG4gICAgICAgIGxldCBnaG9wdCA9IHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBcInVzZXItYWdlbnRcIjogYCR7cGtnLm5hbWV9LyR7cGtnLnZlcnNpb259YFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy51cmwucmVzb3VyY2UgIT09IFwiZ2l0aHViLmNvbVwiKSB7XG4gICAgICAgICAgICAvLyBmb3IgR0hFXG4gICAgICAgICAgICBnaG9wdC5ob3N0ID0gdGhpcy51cmwucmVzb3VyY2U7XG4gICAgICAgICAgICBnaG9wdC5wYXRoUHJlZml4ID0gXCIvYXBpL3YzXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcmlnaW5hbCA9IG5ldyBHaXRIdWIoZ2hvcHQpO1xuICAgICAgICB0aGlzLm9yaWdpbmFsLmF1dGhlbnRpY2F0ZSh7XG4gICAgICAgICAgICB0eXBlOiBcInRva2VuXCIsIHRva2VuOiBvcHRpb25zLnRva2VuXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1bGxSZXF1ZXN0KGJhc2VCcmFuY2gsIG5ld0JyYW5jaCwgZGlmZikge1xuICAgICAgICB0aGlzLkxPRyhgcHJlcGFyZSBQdWxsUmVxdWVzdCAke3RoaXMudXJsLnRvU3RyaW5nKFwiaHR0cHNcIil9ICR7YmFzZUJyYW5jaH0uLi4ke25ld0JyYW5jaH1gKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5leGVjdXRlKSB7XG4gICAgICAgICAgICB0aGlzLkxPRyhcIkNyZWF0ZSBNYXJrZG93biBSZXBvcnQgZm9yIFB1bGxSZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgIHJldHVybiB0b0NvbXBhcmVNb2RlbHModGhpcy5MT0csIHRoaXMub3JpZ2luYWwsIHRoaXMub3B0aW9ucy53b3JraW5nZGlyLCBkaWZmKVxuICAgICAgICAgICAgICAgIC50aGVuKHRvTWFya2Rvd24pXG4gICAgICAgICAgICAgICAgLnRoZW4odmlldyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvd25lcjogdGhpcy51cmwub3duZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXBvOiB0aGlzLnVybC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZTogYmFzZUJyYW5jaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWQ6IG5ld0JyYW5jaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgdXBkYXRlIGRlcGVuZGVuY2llcyBhdCAke3RoaXMub3B0aW9ucy5ub3d9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IHZpZXdcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KS50aGVuKHZhbHVlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5MT0coXCJCRUdJTiBTZW5kIFB1bGxSZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWwucHVsbFJlcXVlc3RzLmNyZWF0ZSh2YWx1ZSkudGhlbihib2R5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuTE9HKGBFTkQgICBTZW5kIFB1bGxSZXF1ZXN0LiAke2JvZHkuZGF0YS5odG1sX3VybH1gKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLkxPRyhcIlNlbmRpbmcgUHVsbFJlcXVlc3QgaXMgc2tpcHBlZCBiZWNhdXNlIC0tZXhlY3V0ZSBpcyBub3Qgc3BlY2lmaWVkLlwiKTtcbiAgICAgICAgICAgIHJldHVybiB0b0NvbXBhcmVNb2RlbHModGhpcy5MT0csIHRoaXMub3JpZ2luYWwsIHRoaXMub3B0aW9ucy53b3JraW5nZGlyLCBkaWZmKVxuICAgICAgICAgICAgICAgIC50aGVuKHRvVGV4dFRhYmxlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==