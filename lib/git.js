"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _spawn = require("./promise/spawn");

var _spawn2 = _interopRequireDefault(_spawn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = class {
    constructor(workingdir, LOG) {
        this.cwd = workingdir;
        this.LOG = LOG;
    }

    run(subcmd = []) {
        let msg = `git ${subcmd.join(" ")}`;
        this.LOG(`BEGIN ${msg}`);
        return (0, _spawn2.default)("git", subcmd, { cwd: this.cwd }).then(result => {
            this.LOG(`END   ${msg}`);
            return result;
        });
    }

    setup(name, email) {
        return this.config("user.name", name).then(() => this.config("user.email", email));
    }

    config(key, value) {
        return this.run(["config", key, value]);
    }

    fetch(remote) {
        return this.run(["fetch", "--prune", remote]);
    }

    branchList() {
        return this.run(["branch", "-a"]).then(out => out.stdout.split(/[\r]?\n/));
    }

    currentBranch() {
        return this.run(["rev-parse", "--abbrev-ref", "HEAD"]).then(out => out.stdout.trim());
    }

    checkout(branch) {
        return this.run(["checkout", branch]);
    }

    checkoutWith(newBranch) {
        return this.run(["checkout", "-b", newBranch]);
    }

    add(file) {
        return this.run(["add", file]);
    }

    commit(message) {
        return this.run(["commit", "-m", message]);
    }

    push(remote, branch) {
        return this.run(["push", remote, branch]);
    }

    addRemote(name, url) {
        return this.run(["remote", "add", name, url]);
    }

    removeRemote(name) {
        return this.run(["remote", "remove", name]);
    }

    remoteurl(remote) {
        return this.run(["remote", "get-url", "--push", remote]).then(out => {
            return out.stdout.trim();
        });
    }

    deleteBranch(branch) {
        return this.run(["branch", "-D", branch]);
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9naXQuanMiXSwibmFtZXMiOlsiY29uc3RydWN0b3IiLCJ3b3JraW5nZGlyIiwiTE9HIiwiY3dkIiwicnVuIiwic3ViY21kIiwibXNnIiwiam9pbiIsInRoZW4iLCJyZXN1bHQiLCJzZXR1cCIsIm5hbWUiLCJlbWFpbCIsImNvbmZpZyIsImtleSIsInZhbHVlIiwiZmV0Y2giLCJyZW1vdGUiLCJicmFuY2hMaXN0Iiwib3V0Iiwic3Rkb3V0Iiwic3BsaXQiLCJjdXJyZW50QnJhbmNoIiwidHJpbSIsImNoZWNrb3V0IiwiYnJhbmNoIiwiY2hlY2tvdXRXaXRoIiwibmV3QnJhbmNoIiwiYWRkIiwiZmlsZSIsImNvbW1pdCIsIm1lc3NhZ2UiLCJwdXNoIiwiYWRkUmVtb3RlIiwidXJsIiwicmVtb3ZlUmVtb3RlIiwicmVtb3RldXJsIiwiZGVsZXRlQnJhbmNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7Ozs7O2tCQUVlLE1BQU07QUFDakJBLGdCQUFZQyxVQUFaLEVBQXdCQyxHQUF4QixFQUE2QjtBQUN6QixhQUFLQyxHQUFMLEdBQVdGLFVBQVg7QUFDQSxhQUFLQyxHQUFMLEdBQVdBLEdBQVg7QUFDSDs7QUFFREUsUUFBSUMsU0FBUyxFQUFiLEVBQWlCO0FBQ2IsWUFBSUMsTUFBTyxPQUFNRCxPQUFPRSxJQUFQLENBQVksR0FBWixDQUFpQixFQUFsQztBQUNBLGFBQUtMLEdBQUwsQ0FBVSxTQUFRSSxHQUFJLEVBQXRCO0FBQ0EsZUFBTyxxQkFBTSxLQUFOLEVBQWFELE1BQWIsRUFBcUIsRUFBRUYsS0FBSyxLQUFLQSxHQUFaLEVBQXJCLEVBQXdDSyxJQUF4QyxDQUE2Q0MsVUFBVTtBQUMxRCxpQkFBS1AsR0FBTCxDQUFVLFNBQVFJLEdBQUksRUFBdEI7QUFDQSxtQkFBT0csTUFBUDtBQUNILFNBSE0sQ0FBUDtBQUlIOztBQUVEQyxVQUFNQyxJQUFOLEVBQVlDLEtBQVosRUFBbUI7QUFDZixlQUFPLEtBQUtDLE1BQUwsQ0FBWSxXQUFaLEVBQXlCRixJQUF6QixFQUNGSCxJQURFLENBQ0csTUFBTSxLQUFLSyxNQUFMLENBQVksWUFBWixFQUEwQkQsS0FBMUIsQ0FEVCxDQUFQO0FBRUg7O0FBRURDLFdBQU9DLEdBQVAsRUFBWUMsS0FBWixFQUFtQjtBQUNmLGVBQU8sS0FBS1gsR0FBTCxDQUFTLENBQUMsUUFBRCxFQUFXVSxHQUFYLEVBQWdCQyxLQUFoQixDQUFULENBQVA7QUFDSDs7QUFFREMsVUFBTUMsTUFBTixFQUFjO0FBQ1YsZUFBTyxLQUFLYixHQUFMLENBQVMsQ0FBQyxPQUFELEVBQVUsU0FBVixFQUFxQmEsTUFBckIsQ0FBVCxDQUFQO0FBQ0g7O0FBRURDLGlCQUFhO0FBQ1QsZUFBTyxLQUFLZCxHQUFMLENBQVMsQ0FBQyxRQUFELEVBQVcsSUFBWCxDQUFULEVBQ0ZJLElBREUsQ0FDR1csT0FBT0EsSUFBSUMsTUFBSixDQUFXQyxLQUFYLENBQWlCLFNBQWpCLENBRFYsQ0FBUDtBQUVIOztBQUVEQyxvQkFBZ0I7QUFDWixlQUFPLEtBQUtsQixHQUFMLENBQVMsQ0FBQyxXQUFELEVBQWMsY0FBZCxFQUE4QixNQUE5QixDQUFULEVBQ0ZJLElBREUsQ0FDR1csT0FBT0EsSUFBSUMsTUFBSixDQUFXRyxJQUFYLEVBRFYsQ0FBUDtBQUVIOztBQUVEQyxhQUFTQyxNQUFULEVBQWlCO0FBQ2IsZUFBTyxLQUFLckIsR0FBTCxDQUFTLENBQUMsVUFBRCxFQUFhcUIsTUFBYixDQUFULENBQVA7QUFDSDs7QUFFREMsaUJBQWFDLFNBQWIsRUFBd0I7QUFDcEIsZUFBTyxLQUFLdkIsR0FBTCxDQUFTLENBQUMsVUFBRCxFQUFhLElBQWIsRUFBbUJ1QixTQUFuQixDQUFULENBQVA7QUFDSDs7QUFFREMsUUFBSUMsSUFBSixFQUFVO0FBQ04sZUFBTyxLQUFLekIsR0FBTCxDQUFTLENBQUMsS0FBRCxFQUFReUIsSUFBUixDQUFULENBQVA7QUFDSDs7QUFFREMsV0FBT0MsT0FBUCxFQUFnQjtBQUNaLGVBQU8sS0FBSzNCLEdBQUwsQ0FBUyxDQUFDLFFBQUQsRUFBVyxJQUFYLEVBQWlCMkIsT0FBakIsQ0FBVCxDQUFQO0FBQ0g7O0FBRURDLFNBQUtmLE1BQUwsRUFBYVEsTUFBYixFQUFxQjtBQUNqQixlQUFPLEtBQUtyQixHQUFMLENBQVMsQ0FBQyxNQUFELEVBQVNhLE1BQVQsRUFBaUJRLE1BQWpCLENBQVQsQ0FBUDtBQUNIOztBQUVEUSxjQUFVdEIsSUFBVixFQUFnQnVCLEdBQWhCLEVBQXFCO0FBQ2pCLGVBQU8sS0FBSzlCLEdBQUwsQ0FBUyxDQUFDLFFBQUQsRUFBVyxLQUFYLEVBQWtCTyxJQUFsQixFQUF3QnVCLEdBQXhCLENBQVQsQ0FBUDtBQUNIOztBQUVEQyxpQkFBYXhCLElBQWIsRUFBbUI7QUFDZixlQUFPLEtBQUtQLEdBQUwsQ0FBUyxDQUFDLFFBQUQsRUFBVyxRQUFYLEVBQXFCTyxJQUFyQixDQUFULENBQVA7QUFDSDs7QUFFRHlCLGNBQVVuQixNQUFWLEVBQWtCO0FBQ2QsZUFBTyxLQUFLYixHQUFMLENBQVMsQ0FBQyxRQUFELEVBQVcsU0FBWCxFQUFzQixRQUF0QixFQUFnQ2EsTUFBaEMsQ0FBVCxFQUFrRFQsSUFBbEQsQ0FBdURXLE9BQU87QUFDakUsbUJBQU9BLElBQUlDLE1BQUosQ0FBV0csSUFBWCxFQUFQO0FBQ0gsU0FGTSxDQUFQO0FBR0g7O0FBRURjLGlCQUFhWixNQUFiLEVBQXFCO0FBQ2pCLGVBQU8sS0FBS3JCLEdBQUwsQ0FBUyxDQUFDLFFBQUQsRUFBVyxJQUFYLEVBQWlCcUIsTUFBakIsQ0FBVCxDQUFQO0FBQ0g7QUExRWdCLEMiLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHNwYXduIGZyb20gXCIuL3Byb21pc2Uvc3Bhd25cIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKHdvcmtpbmdkaXIsIExPRykge1xuICAgICAgICB0aGlzLmN3ZCA9IHdvcmtpbmdkaXI7XG4gICAgICAgIHRoaXMuTE9HID0gTE9HO1xuICAgIH1cblxuICAgIHJ1bihzdWJjbWQgPSBbXSkge1xuICAgICAgICBsZXQgbXNnID0gYGdpdCAke3N1YmNtZC5qb2luKFwiIFwiKX1gO1xuICAgICAgICB0aGlzLkxPRyhgQkVHSU4gJHttc2d9YCk7XG4gICAgICAgIHJldHVybiBzcGF3bihcImdpdFwiLCBzdWJjbWQsIHsgY3dkOiB0aGlzLmN3ZCB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICB0aGlzLkxPRyhgRU5EICAgJHttc2d9YCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXR1cChuYW1lLCBlbWFpbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWcoXCJ1c2VyLm5hbWVcIiwgbmFtZSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuY29uZmlnKFwidXNlci5lbWFpbFwiLCBlbWFpbCkpO1xuICAgIH1cblxuICAgIGNvbmZpZyhrZXksIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bihbXCJjb25maWdcIiwga2V5LCB2YWx1ZV0pO1xuICAgIH1cblxuICAgIGZldGNoKHJlbW90ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4oW1wiZmV0Y2hcIiwgXCItLXBydW5lXCIsIHJlbW90ZV0pO1xuICAgIH1cblxuICAgIGJyYW5jaExpc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bihbXCJicmFuY2hcIiwgXCItYVwiXSlcbiAgICAgICAgICAgIC50aGVuKG91dCA9PiBvdXQuc3Rkb3V0LnNwbGl0KC9bXFxyXT9cXG4vKSk7XG4gICAgfVxuXG4gICAgY3VycmVudEJyYW5jaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuKFtcInJldi1wYXJzZVwiLCBcIi0tYWJicmV2LXJlZlwiLCBcIkhFQURcIl0pXG4gICAgICAgICAgICAudGhlbihvdXQgPT4gb3V0LnN0ZG91dC50cmltKCkpO1xuICAgIH1cblxuICAgIGNoZWNrb3V0KGJyYW5jaCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4oW1wiY2hlY2tvdXRcIiwgYnJhbmNoXSk7XG4gICAgfVxuXG4gICAgY2hlY2tvdXRXaXRoKG5ld0JyYW5jaCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4oW1wiY2hlY2tvdXRcIiwgXCItYlwiLCBuZXdCcmFuY2hdKTtcbiAgICB9XG5cbiAgICBhZGQoZmlsZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4oW1wiYWRkXCIsIGZpbGVdKTtcbiAgICB9XG5cbiAgICBjb21taXQobWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4oW1wiY29tbWl0XCIsIFwiLW1cIiwgbWVzc2FnZV0pO1xuICAgIH1cblxuICAgIHB1c2gocmVtb3RlLCBicmFuY2gpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuKFtcInB1c2hcIiwgcmVtb3RlLCBicmFuY2hdKTtcbiAgICB9XG5cbiAgICBhZGRSZW1vdGUobmFtZSwgdXJsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bihbXCJyZW1vdGVcIiwgXCJhZGRcIiwgbmFtZSwgdXJsXSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlUmVtb3RlKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuKFtcInJlbW90ZVwiLCBcInJlbW92ZVwiLCBuYW1lXSk7XG4gICAgfVxuXG4gICAgcmVtb3RldXJsKHJlbW90ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW4oW1wicmVtb3RlXCIsIFwiZ2V0LXVybFwiLCBcIi0tcHVzaFwiLCByZW1vdGVdKS50aGVuKG91dCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gb3V0LnN0ZG91dC50cmltKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRlbGV0ZUJyYW5jaChicmFuY2gpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuKFtcImJyYW5jaFwiLCBcIi1EXCIsIGJyYW5jaF0pO1xuICAgIH1cbn1cbiJdfQ==