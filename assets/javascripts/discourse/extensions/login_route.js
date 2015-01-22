// overwriting because by default it would replaceWith('discovery.latest')
require("discourse/routes/login")["default"].reopen({
  beforeModel: function() {
    if (!Discourse.SiteSettings.login_required) {
      this.replaceWith('micro-forums').then(function(e) {
        Ember.run.next(function() {
          e.send('showLogin');
        });
      });
    }
  },

  // model: function() {
  //   return Discourse.StaticPage.find('login');
  // },

  // renderTemplate: function() {
  //   // do nothing
  //   this.render('static');
  // },

  // setupController: function(controller, model) {
  //   this.controllerFor('static').set('model', model);
  // }
});
