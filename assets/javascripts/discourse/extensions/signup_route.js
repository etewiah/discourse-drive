// overwriting because by default it would replaceWith('discovery.latest')
require("discourse/routes/signup")["default"].reopen({
  beforeModel: function() {
    this.replaceWith('micro-forums').then(function(e) {
      Ember.run.next(function() {
        e.send('showCreateAccount');
      });
    });
  }
});
