// overwriting because by default it would replaceWith('discovery.latest')
require("discourse/routes/signup")["default"].reopen({
  beforeModel: function() {
    debugger;
    this.replaceWith('welcome').then(function(e) {
      Ember.run.next(function() {
        e.send('showCreateAccount');
      });
    });
  }
});
