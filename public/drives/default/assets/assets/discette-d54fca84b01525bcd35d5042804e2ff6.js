define("discette/app", 
  ["ember","ember/resolver","ember/load-initializers","discette/config/environment","rails-csrf/config","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Resolver = __dependency2__["default"];
    var loadInitializers = __dependency3__["default"];
    var config = __dependency4__["default"];
    var setCsrfUrl = __dependency5__.setCsrfUrl;

    setCsrfUrl('/session/csrf.json');

    Ember.MODEL_FACTORY_INJECTIONS = true;

    var App = Ember.Application.extend({
      modulePrefix: config.modulePrefix,
      podModulePrefix: config.podModulePrefix,
      Resolver: Resolver
    });

    loadInitializers(App, config.modulePrefix);
    loadInitializers(App, 'rails-csrf');

    __exports__["default"] = App;
  });
define("discette/components/content-composer", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Component.extend({
      actions: {
        save: function() {
          this.set('validate', true);
          if (this.get('content').length < this.get('minContentLength')) {
            return;
          }

          this.sendAction('save');
        },
        cancel: function() {
          this.sendAction('cancel');
        },
      },

      classNames: ['pgdn-editor'],
      btnSize: 'btn-xs',
      height: 120,
      focus: false,
      airMode: false,

      willDestroyElement: function() {
        this.$('textarea').destroy();
      },

      didInsertElement: function() {
        // var _this = this;

        this.$('textarea').pagedownBootstrap();
        var content = this.get('content') || "";
        this.set('content', content);


        // var _content = this.get('content');
        // this.$('textarea').code(_content);
        // this.$('.btn').addClass(_btnSize);
      },

      keyUp: function() {
        this.doUpdate();
      },

      click: function() {
        this.doUpdate();
      },

      doUpdate: function() {
        var content = this.$('.pgdn-textarea').val();
        this.set('content', content);
      },

      composerValidation: function() {
        if (!this.get('validate')) {
          return;
        }
        if (this.get('serverError')) {
          return Ember.Object.create({
            failed: true,
            reason: this.get('serverError')

          });
        }
        // if (Ember.empty('content')) {
        //   return Ember.Object.create({
        //     failed: true,
        //     reason: "Please enter a description."
        //   });
        // }
        // If too short
        if (this.get('content').length < this.get('minContentLength')) {
          return Ember.Object.create({
            failed: true,
            reason: "Content is too short."
          });
        }

        // Looks good!
        return Ember.Object.create({
          ok: true,
          reason: "Ok"
        });
      }.property('validate', 'content', 'serverError'),


    });
  });
define("discette/components/discette-form", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // import Discette from '../models/discette';

    __exports__["default"] = Ember.Component.extend({
      validate: false,
      actions: {
        deleteDiscette: function() {
         var confirmationObject = Ember.Object.create({
            displayText: "Are you sure you want to delete this discette?"
          });
          confirmationObject.reopen({
            confirm: function(modal) {
              var discetteModel = this.get('discette');
              var self = this;
              discetteModel.destroyOnServer(function(result) {
                  modal.send('closeModal');
                  self.sendAction('onDeleteSuccessAction', result);
                },
                function(error) {
                  var errorMessage = "Sorry, there has been an error.";
                  if (error.responseJSON && error.responseJSON.errors) {
                    errorMessage = error.responseJSON.errors[0];
                  }
                  modal.flash(errorMessage, 'error');
                  modal.set('validate', false);
                }
              );
            }.bind(this)
          });
          this.sendAction('openModalAction', 'modal/confirm-action', confirmationObject);
        },
        createDiscette: function() {
          if (this.get('discette.name').length < 3) {
            this.set('validate', true);
            return;
          }
          var discetteModel = this.get('discette');
          var self = this;
          discetteModel.createOnServer(function(result) {
              self.sendAction('onCreateSuccessAction', result);
            },
            function(error) {
              // self.set('serverError', error.responseJSON.errors[0]);
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              self.set('serverError', errorMessage);
              self.set('validate', false);
            }
          );
        },
        updateDiscette: function() {
          if (this.get('discette.name').length < 3) {
            this.set('validate', true);
            return;
          }
          var discetteModel = this.get('discette');
          var self = this;
          discetteModel.updateOnServer(function(result) {
              self.set('successMessage', "discette updated successfully.");
              self.set('validate', false);
              // self.transitionToRoute('drive-admin.discettes.details', result.id);
            },
            function(error) {
              // self.set('serverError', error.responseJSON.errors[0]);
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              self.set('serverError', errorMessage);
              self.set('validate', false);
            }
          );
        }
      },
      nameValidation: function() {
        if (!this.get('validate')) {
          return;
        }
        if (Ember.empty('discette.name')) {
          return Ember.Object.create({
            failed: true,
            reason: "Please enter a name."
          });
        }
        if (this.get('discette.name').length < 3) {
          return Ember.Object.create({
            failed: true,
            reason: "Name has to be at least 3 characters long."
          });
        }

        // Looks good!
        return Ember.Object.create({
          ok: true,
          reason: "Ok"
        });
      }.property('validate', 'discette.name'),

    });
  });
define("discette/components/discette-header", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    var originalZIndex;

    __exports__["default"] = Ember.Component.extend({
      actions: {
        showSignUp: function() {
          //not so sure destination_url works with sign-up
          // in discourse login controller, it gets passed to hidden login form for redirection - in create-account controller it doesn't get passed
          $.cookie('destination_url', location.href);
          var rootDomainBaseUrl = PreloadStore.get('discetteSettings.rootDomainBaseUrl') || 'http://klavado.com';
          window.location = rootDomainBaseUrl + "/signup";
        },
        showLogIn: function() {
          this.sendAction('showLogInAction');
          //setting this cookie ensures I will be redirected here after signup
          // $.cookie('destination_url', location.href);
          // var rootDomainBaseUrl = PreloadStore.get('discetteSettings.rootDomainBaseUrl') || 'http://klavado.com';
          // window.location = rootDomainBaseUrl + "/login";
        },
        logout: function() {
          // Discourse implements this in the user model - I should do that myself too
          // var discourseUserClass = this;
          var userName = this.get('currentUser.username');

          var $dropdown = $("#user-dropdown");
          $dropdown.fadeOut();
          // Discourse.User.currentProp('username')
          return $.ajax("/session/" + userName + ".json", {
            type: 'DELETE'
          }).then(function() {
            this.set('currentUser', null);
            // window.location = location.href;
          }.bind(this));
        }
      },
      signedIn: function() {
        if (this.get('currentUser.username')) {
          return true;
        } else {
          return false;
        }
        // var userJson = PreloadStore.get('currentUser');
        // if (userJson) {
        //   userJson.avatarUrl = "http://klavado.com" + userJson.avatar_template.replace(/\{size\}/g, '32');
        //   return userJson;
        //   // return Discourse.User.create(userJson);
        // }
        // return null;
      }.property('currentUser'),

      willDestroyElement: function() {
        // $(window).unbind('scroll.discourse-dock');
        // $(document).unbind('touchmove.discourse-dock');
        // this.$('a.unread-private-messages, a.unread-notifications, a[data-notifications]').off('click.notifications');
        this.$('a[data-dropdown]').off('click.dropdown');
      },

      didInsertElement: function() {
        var self = this;
        this.$('a[data-dropdown]').on('click.dropdown', function(e) {
          self.showDropdown.apply(self, [$(e.currentTarget)]);
          return false;
        });
      },

      renderDropdowns: false,

      showDropdown: function($target) {
        var self = this;
        if (!this.get("renderDropdowns")) {
          this.set("renderDropdowns", true);
          Em.run.next(function() {
            self.showDropdown($target);
          });
          return;
        }

        var elementId = $target.data('dropdown') || $target.data('notifications'),
          $dropdown = $("#" + elementId),
          $li = $target.closest('li'),
          $ul = $target.closest('ul'),
          $html = $('html'),
          $header = $('header'),
          replyZIndex = parseInt($('#reply-control').css('z-index'), 10);


        originalZIndex = originalZIndex || $('header').css('z-index');

        if (replyZIndex > 0) {
          $header.css("z-index", replyZIndex + 1);
        }

        var controller = self.get('controller');
        if (controller && !controller.isDestroyed) {
          controller.set('visibleDropdown', elementId);
        }
        // we need to ensure we are rendered,
        //  this optimises the speed of the initial render
        var render = $target.data('render');
        if (render) {
          if (!this.get(render)) {
            this.set(render, true);
            Em.run.next(this, function() {
              this.showDropdown.apply(self, [$target]);
            });
            return;
          }
        }

        var hideDropdown = function() {
          $header.css("z-index", originalZIndex);
          $dropdown.fadeOut('fast');
          $li.removeClass('active');
          $html.data('hide-dropdown', null);
          var controller = self.get('controller');
          if (controller && !controller.isDestroyed) {
            controller.set('visibleDropdown', null);
          }
          return $html.off('click.d-dropdown');
        };
        // if a dropdown is active and the user clicks on it, close it
        if ($li.hasClass('active')) {
          return hideDropdown();
        }
        // otherwhise, mark it as active
        $li.addClass('active');
        // hide the other dropdowns
        $('li', $ul).not($li).removeClass('active');
        $('.d-dropdown').not($dropdown).fadeOut('fast');
        // fade it fast
        $dropdown.fadeIn('fast');
        // autofocus any text input field
        $dropdown.find('input[type=text]').focus().select();

        $html.on('click.d-dropdown', function(e) {
          return $(e.target).closest('.d-dropdown').length > 0 ? true : hideDropdown.apply(self);
        });

        $html.data('hide-dropdown', hideDropdown);

        return false;
      }
    });
  });
define("discette/components/input-tip", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Component.extend({
      classNameBindings: [':tip', 'good', 'bad'],

      // shouldRerender: Discourse.View.renderIfChanged('validation'),
      // below is reimplementation of above from discourse:
      shouldRerender: function(){
        Ember.run.once(this, 'rerender');
      }.observes('validation'),
      bad: Em.computed.alias('validation.failed'),
      good: Em.computed.not('bad'),

      render: function(buffer) {
        var reason = this.get('validation.reason');
        if (reason) {
          var icon = this.get('good') ? 'fa-check' : 'fa-times';
          return buffer.push("<i class=\"fa " + icon + "\"></i> " + reason);
        }
      }
    });
  });
define("discette/components/pagedown-bootstrap", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Component.extend({

      classNames: ['pgdn-editor'],
      btnSize: 'btn-xs',
      height: 120,
      focus: false,
      airMode: false,

      willDestroyElement: function() {
        this.$('textarea').destroy();
      },

      didInsertElement: function() {
        var _this = this;
    // debugger;
        this.$('textarea').pagedownBootstrap();

        // var _content = this.get('content');
        // this.$('textarea').code(_content);
        // this.$('.btn').addClass(_btnSize);
      },
      
      keyUp: function() {
        this.doUpdate();
      },

      click: function() {
        this.doUpdate();
      },

      doUpdate: function() {
        var content = this.$('.pgdn-textarea').val();
        this.set('content', content);
      }


    });
  });
define("discette/components/post-details", 
  ["ember","discette/models/post","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Post = __dependency2__["default"];

    __exports__["default"] = Ember.Component.extend({
      isVisible: true,
      actions: {
        startDeletingPost: function() {
          var confirmationObject = Ember.Object.create({
            displayText: "Are you sure you want to delete this post?"
          });
          confirmationObject.reopen({
            confirm: function(modal) {
              var postModel = this.get('postModel');
              var self = this;
              postModel.destroy(function(result) {
                  modal.send('closeModal');
                  self.set('isVisible', false);
                },
                function(error) {
                  var errorMessage = "Sorry, there has been an error.";
                  if (error.responseJSON && error.responseJSON.errors) {
                    errorMessage = error.responseJSON.errors[0];
                  }
                  modal.flash(errorMessage, 'error');
                  modal.set('validate', false);
                }
              );
            }.bind(this)
          });
          // debugger;
          this.sendAction('openModalAction', 'modal/confirm-action', confirmationObject);
        },
        startEditingPost: function() {
          // this.controllerFor('modal/edit_post').set('model', this.postModel);
          // passing a model below means it gets set as the modal's model
          this.sendAction('openModalAction', 'modal/edit-post', this.get('postModel'));
        }
      },
      longCreatedAt: function() {
        return window.moment(this.postModel.created_at).format('MMMM Do YYYY, h:mm:ss a');
      }.property(),
      avatarUrl: function() {
        var avatarUrl = "http://klavado.com" + this.postModel.avatar_template.replace(/\{size\}/g, '45');
        //uploads/default/_optimized/8cf/c03/e2885952b7_45x45.JPG"; 
        return avatarUrl;
      }.property('post'),
      usernameUrl: function() {
          var usernameUrl = "/users/" + this.postModel.username;
          //uploads/default/_optimized/8cf/c03/e2885952b7_45x45.JPG"; 
          return usernameUrl;
        }.property('post')
        // postModel: function(){
        //   debugger;
        //   return Post.create(this.postModel);
        // }.property('post')
    });
  });
define("discette/components/section-form", 
  ["ember","discette/models/section","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Section = __dependency2__["default"];

    __exports__["default"] = Ember.Component.extend({
      validate: false,
      actions: {
        createSection: function() {
          if (this.get('section.name').length < 3) {
            this.set('validate', true);
            return;
          }
          var sectionModel = this.get('section');
          // var sectionModel = Section.create(sectionJSON);
          var self = this;
          sectionModel.createOnServer(function(result) {
              self.sendAction('onCreateSuccessAction', result);
            },
            function(error) {
              // self.set('serverError', error.responseJSON.errors[0]);
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              self.set('serverError', errorMessage);
              self.set('validate', false);
            }
          );
        },
        updateSection: function() {
          if (this.get('section.name').length < 3) {
            this.set('validate', true);
            return;
          }
          var sectionJSON = this.get('section');
          var sectionModel = Section.create(sectionJSON);
          var self = this;
          sectionModel.updateOnServer(function(result) {
              self.set('successMessage', "section updated successfully.");
              self.set('validate', false);
              // self.transitionToRoute('drive-admin.sections.details', result.id);
            },
            function(error) {
              // self.set('serverError', error.responseJSON.errors[0]);
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              self.set('serverError', errorMessage);
              self.set('validate', false);
            }
          );
        }
      },
      nameValidation: function() {
        if (!this.get('validate')) {
          return;
        }
        if (Ember.empty('section.name')) {
          return Ember.Object.create({
            failed: true,
            reason: "Please enter a name."
          });
        }
        if (this.get('section.name').length < 3) {
          return Ember.Object.create({
            failed: true,
            reason: "Name has to be at least 3 characters long."
          });
        }

        // Looks good!
        return Ember.Object.create({
          ok: true,
          reason: "Ok"
        });
      }.property('validate', 'section.name'),
      // sectionUrl: function() {
      //   var subdomainLower = this.get('section.subdomain_lower');
      //   return this.get('currentSection.root_url').replace('://',"://" + subdomainLower + ".");
      // }.property('section'),
      // avatarUrl: function() {
      //   if (this.get('sectionOwner')) {
      //     var avatarUrl = this.get('currentSection.root_url') + this.get('sectionOwner.avatar_template').replace(/\{size\}/g, '45');
      //     // "/users/" + this.get('sectionOwner.username');
      //     return avatarUrl;
      //   }
      // }.property('sectionOwner'),
      usernameUrl: function() {
        if (this.get('sectionOwner')) {
          var usernameUrl = "/users/" + this.get('sectionOwner.username');
          return usernameUrl;
        }
      }.property('sectionOwner'),
      createdAt: function() {
        // TODO - fix this after I add timestamps server side
        if (this.get('sectionOwner')) {
          var createdAt = this.get('sectionOwner.created_at');
          return window.moment(createdAt).format('MMMM Do YYYY');
        }
      }.property('sectionOwner'),
      sectionOwner: function() {
        // TODO: fix this:
        if (this.get('section.section_users') && this.get('section.section_users')[0]) {
          return this.get('section.section_users')[0];
        }
      }.property('section'),
    });
  });
define("discette/components/section-overview", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Component.extend({

      sectionUrl: function() {
        var subdomainLower = this.get('section.subdomain_lower');
        return this.get('currentSection.root_url').replace('://',"://" + subdomainLower + ".");
      }.property('section'),
      avatarUrl: function() {
        if (this.get('sectionOwner')) {
          var avatarUrl = this.get('currentSection.root_url') + this.get('sectionOwner.avatar_template').replace(/\{size\}/g, '45');
          // "/users/" + this.get('sectionOwner.username');
          return avatarUrl;
        }
      }.property('sectionOwner'),
      usernameUrl: function() {
        if (this.get('sectionOwner')) {
          var usernameUrl = "/users/" + this.get('sectionOwner.username');
          return usernameUrl;
        }
      }.property('sectionOwner'),
      createdAt: function() {
        // TODO - fix this after I add timestamps server side
        if (this.get('sectionOwner')) {
          var createdAt = this.get('sectionOwner.created_at');
          return window.moment(createdAt).format('MMMM Do YYYY');
        }
      }.property('sectionOwner'),
      sectionOwner: function() {
        // debugger;
        // TODO: fix this:
        if (this.get('section.section_users') && this.get('section.section_users')[0]) {
          return this.get('section.section_users')[0];
        }
      }.property('section'),
    });
  });
define("discette/components/summer-note", 
  ["ember-cli-summernote/components/summer-note","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*
    	This is just a proxy file requiring the component from the /addon folder and
    	making it available to the dummy application!
     */
    var SummerNoteComponent = __dependency1__["default"];
     
    __exports__["default"] = SummerNoteComponent;
  });
define("discette/controllers/application", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];


    __exports__["default"] = Ember.Controller.extend({
      // TODO - get below from settings service like I do with currentSection
      // currentUser: function() {
      //   var userJson = PreloadStore.get('currentUser');
      //   var rootDomainBaseUrl = this.get('settingsService.currentSection.rootUrl');
      //   // PreloadStore.get('discetteSettings.rootDomainBaseUrl') || 'http://klavado.com';
      //   if (userJson) {
      //     userJson.avatarUrl = rootDomainBaseUrl + userJson.avatar_template.replace(/\{size\}/g, '32');
      //     return userJson;
      //     // return Discourse.User.create(userJson);
      //   }
      //   return null;
      // }.property(),
      // below gets passed to discette-header component to be used for displaying section title
      currentSection: function() {
        var section = this.get('settingsService.currentSection');
        return section;
      }.property(),
      currentUser: function() {
        var section = this.get('settingsService.currentUser');
        return section;
      }.property()
    });
  });
define("discette/controllers/drive-admin/sections/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // import Section from '../../../models/section';


    __exports__["default"] = Ember.Controller.extend({
      // needs: ['drive-admin'],
      // newSection: {},
      // nameValidation: function() {
      //   if (!this.get('validate')) {
      //     return;
      //   }
      //   if (Ember.empty('newSection.name')) {
      //     return Ember.Object.create({
      //       failed: true,
      //       reason: "Please enter a name."
      //     });
      //   }
      //   if (this.get('newSection.name').length < 3) {
      //     return Ember.Object.create({
      //       failed: true,
      //       reason: "Name has to be at least 3 characters long."
      //     });
      //   }

      //   // Looks good!
      //   return Ember.Object.create({
      //     ok: true,
      //     reason: "Ok"
      //   });
      // }.property('validate', 'newSection.name'),
      // actions: {
      //   createNewSection: function() {
      //     if (this.get('newSection.name').length < 3) {
      //       this.set('validate', true);
      //       return;
      //     }
      //     var sectionJSON = this.get('newSection');
      //     var sectionModel = Section.create(sectionJSON);
      //     var self = this;
      //     sectionModel.saveNew(function(result) {
      //         debugger;
      //         self.transitionToRoute('drive-admin.sections.details', result.id );
      //       },
      //       function(error) {
      //         // self.set('serverError', error.responseJSON.errors[0]);
      //         var errorMessage = "Sorry, there has been an error.";
      //         if (error.responseJSON && error.responseJSON.errors) {
      //           errorMessage = error.responseJSON.errors[0];
      //         }
      //         self.set('serverError', errorMessage);
      //         self.set('validate', false);
      //       }
      //     );

      //   },
      // }
    });
  });
define("discette/controllers/home/about", 
  ["ember","discette/models/post","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Post = __dependency2__["default"];

    __exports__["default"] = Ember.Controller.extend({
      primaryPost: function() {
        return this.get('model.topic.post_stream.posts.firstObject');
      }.property('model'),
      comments: function() {
        var postModels = [];
        var posts = this.get('model.topic.post_stream.posts');
        posts.forEach(function(postJSON) {
          if (postJSON.post_number !== 1) {

            var postModel = Post.create(postJSON);
            postModels.pushObject(postModel);
          }
        });
        return postModels;
      }.property('model.topic.post_stream.posts')
    });
  });
define("discette/controllers/modal", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var ModalController;

    ModalController = Ember.Controller.extend({
    	// if I use ObjectController as below, get errors about setting content on proxy..
    	// ModalController = Ember.ObjectController.extend({
      actions: {
        cancel: function() {
          if (this.content) {
            this.content.rollback();
          }
          return this.send('closeModal');
        }
      },
      flash: function(message, messageClass) {
        this.set('flashMessage', Em.Object.create({
          message: message,
          messageClass: messageClass
        }));
      }
    });

    __exports__["default"] = ModalController;
  });
define("discette/controllers/modal/confirm-action", 
  ["discette/controllers/modal","discette/models/post","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var ModalController = __dependency1__["default"];
    var Post = __dependency2__["default"];

    __exports__["default"] = ModalController.extend({
      actions: {
        confirmedAction: function(complete, error) {
          var confirmationObject = this.get('model');
          // call the confirm action on the object thats passed in
          confirmationObject.confirm(this);
        }
      }
    });
  });
define("discette/controllers/modal/edit-post", 
  ["discette/controllers/modal","discette/models/post","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var ModalController = __dependency1__["default"];
    var Post = __dependency2__["default"];

    __exports__["default"] = ModalController.extend({
      actions: {
        updatePost: function(complete, error) {
          var post = this.model;
          var self = this;
          post.save(function(result) {
            // server does not return raw when it saves which makes it difficult to edit
            // a second time without this
              // result.raw = self.model.raw.valueOf();
              self.set('model.cooked', result.cooked);
              // self.set('model', Post.create(result));
              self.send('closeModal');
            },
            function(error) {
              // self.set('serverError', error.responseJSON.errors[0]);
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              self.flash(errorMessage, 'error');
              self.set('validate', false);
            }
          );

        }
      }
    });
  });
define("discette/controllers/modal/log-in", 
  ["discette/controllers/modal","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var ModalController = __dependency1__["default"];
    var LogInController;

    LogInController = ModalController.extend({
      needs: ['application'],
      actions: {
        login: function() {
          var self = this;
          var loginName = this.get('loginName');
          var loginPassword = this.get('loginPassword');

          if (Ember.empty(loginName) || Ember.empty(loginPassword)) {
            self.flash('Please enter a username and password', 'error');
            return;
          }

          this.set('loggingIn', true);

          $.ajax("/session", {
            data: {
              login: loginName,
              password: loginPassword
            },
            type: 'POST'
          }).then(function(result) {
            // Successful login
            if (result.error) {
              // self.set('loggingIn', false);
              // if( result.reason === 'not_activated' ) {
              //   self.send('showNotActivated', {
              //     username: self.get('loginName'),
              //     sentTo: result.sent_to_email,
              //     currentEmail: result.current_email
              //   });
              // }
              self.flash(result.error, 'error');
            } else {
              // self.set('loggedIn', true);
              // Trigger the browser's password manager using the hidden static login form:
              var $hidden_login_form = $('#hidden-login-form');
              // var destinationUrl = $.cookie('destination_url');
              $hidden_login_form.find('input[name=username]').val(self.get('loginName'));
              $hidden_login_form.find('input[name=password]').val(self.get('loginPassword'));
              // if (self.get('loginRequired') && destinationUrl) {
              //   // redirect client to the original URL
              //   $.cookie('destination_url', null);
              //   $hidden_login_form.find('input[name=redirect]').val(destinationUrl);
              // } else {
              //   $hidden_login_form.find('input[name=redirect]').val(window.location.href);
              // }
              $hidden_login_form.find('input[name=redirect]').val(window.location.href);
              $hidden_login_form.submit();
            }

          }, function() {
            // Failed to login
            self.flash('Sorry, there has been an error', 'error');
            self.set('loggingIn', false);
          });

          return false;
        },

        externalLogin: function(loginMethod){
          var name = loginMethod.get("name");
          var customLogin = loginMethod.get("customLogin");

          if(customLogin){
            customLogin();
          } else {
            this.set('authenticate', name);
            var left = this.get('lastX') - 400;
            var top = this.get('lastY') - 200;

            var height = loginMethod.get("frameHeight") || 400;
            var width = loginMethod.get("frameWidth") || 800;

            var authUrl =  this.get('settingsService.currentSection.rootUrl') + "/auth/" + name; 
            // Discourse.getURL("/auth/" + name)

            var w = window.open(authUrl, "_blank",
                "menubar=no,status=no,height=" + height + ",width=" + width +  ",left=" + left + ",top=" + top);
            var self = this;
            var timer = setInterval(function() {
              if(!w || w.closed) {
                clearInterval(timer);
                self.set('authenticate', null);
              }
            }, 1000);
          }
        },

        // createAccount: function() {
        //   var createAccountController = this.get('controllers.createAccount');
        //   createAccountController.resetForm();
        //   this.send('showCreateAccount');
        // }
      },

      loginButtons: function() {
        var methods = Ember.A();
        var twitterParams = {
          name: "twitter",
          faClass: "fa-twitter",
          title: "with Twitter",
          message: "twitter message"
        };
        var githubParams = {
          name: "github",
          faClass: "fa-github",
          title: "with GitHub",
          message: "github message"
        };
        var googleOauth2Params = {
          name: "google_oauth2",
          faClass: "fa-google",
          title: "with Google",
          message: "google message",
          frameWidth: 850,
          frameHeight: 500
        };
        var facebookParams = {
          name: "facebook",
          faClass: "fa-facebook",
          title: "with Facebook",
          message: "facebook message",
          frameHeight: 450
        };

        [ twitterParams,
          googleOauth2Params,
          facebookParams,
          githubParams
          // "facebook",
          // "cas",
          // "twitter",
          // "yahoo",
        ].forEach(function(params) {
            // methods.pushObject(Discourse.LoginMethod.create(params));
            methods.pushObject(Ember.Object.create(params));
        });

      return methods;
    }.property(),
    // authMessage: (function() {
    //   if (this.blank('authenticate')) return "";
    //   var method = Discourse.get('LoginMethod.all').findProperty("name", this.get("authenticate"));
    //   if(method){
    //     return method.get('message');
    //   }
    // }).property('authenticate'),

    authenticationComplete: function(options) {
      // if (options.requires_invite) {
      //   this.send('showLogin');
      //   this.flash(I18n.t('login.requires_invite'), 'success');
      //   this.set('authenticate', null);
      //   return;
      // }
      // if (options.awaiting_approval) {
      //   this.send('showLogin');
      //   this.flash(I18n.t('login.awaiting_approval'), 'success');
      //   this.set('authenticate', null);
      //   return;
      // }
      // if (options.awaiting_activation) {
      //   this.send('showLogin');
      //   this.flash(I18n.t('login.awaiting_confirmation'), 'success');
      //   this.set('authenticate', null);
      //   return;
      // }
      // if (options.not_allowed_from_ip_address) {
      //   this.send('showLogin');
      //   this.flash(I18n.t('login.not_allowed_from_ip_address'), 'success');
      //   this.set('authenticate', null);
      //   return;
      // }
      // Reload the page if we're authenticated
      if (options.authenticated) {
        // TODO - implement logic like below:
        // if (window.location.pathname === Discourse.getURL('/login')) {
        //   window.location.pathname = Discourse.getURL('/');
        // } else {
        //   window.location.reload();
        // }
        window.location.pathname = '/';
        return;
      }

      var createAccountController = this.get('controllers.createAccount');
      createAccountController.setProperties({
        accountEmail: options.email,
        accountUsername: options.username,
        accountName: options.name,
        authOptions: Em.Object.create(options)
      });
      this.send('showCreateAccount');
    }
    });

    __exports__["default"] = LogInController;
  });
define("discette/controllers/modal/new-topic", 
  ["discette/controllers/modal","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var ModalController = __dependency1__["default"];
    // import Ember from 'ember';

    __exports__["default"] = ModalController.extend({
      // needs: ['home'],

      // onShow: function() {
      //   var defaultGeo = {
      //     bounds_value: "spain"
      //   }
      //   this.set('geo', defaultGeo);
      // },
      firstPost: "",
      topicTitle: "",
      readyToAdd: function() {
        if (Ember.isBlank(this.get('topicTitle'))) {
          return false;
        } else {
          return true;
        }
      }.property('topicTitle'),

      firstPostValidation: function() {
        if (!this.get('validate')) {
          return;
        }
        if (this.get('serverError')) {
          return Ember.Object.create({
            failed: true,
            reason: this.get('serverError')

          });
        }
        if (Ember.empty('firstPost')) {
          return Ember.Object.create({
            failed: true,
            reason: "Please enter a description."
          });
        }
        // If too short
        if (this.get('firstPost').length < 15) {
          return Ember.Object.create({
            failed: true,
            reason: "Has to be at least 15 characters long."
          });
        }

        // Looks good!
        return Ember.Object.create({
          ok: true,
          reason: "Ok"
        });
      }.property('validate', 'firstPost', 'serverError'),
      titleValidation: function() {
        if (!this.get('validate')) {
          return;
        }
        if (Ember.empty('topicTitle')) {
          return Ember.Object.create({
            failed: true,
            reason: "Please enter a title."
          });
        }
        if (this.get('topicTitle').length < 5) {
          return Ember.Object.create({
            failed: true,
            reason: "Title has to be at least 5 characters long."
          });
        }

        // Looks good!
        return Ember.Object.create({
          ok: true,
          reason: "Ok"
        });
      }.property('validate', 'topicTitle'),

      actions: {
        // closeModal: function() {
        //   debugger;
        // },
        createNewTopic: function() {
          if (this.get('topicTitle').length < 5 || this.get('firstPost').length < 15) {
            this.set('validate', true);
            return;
          }

          var firstPost = this.get('firstPost'),
            title = this.get('topicTitle'),
            categoryId = this.get('settingsService.currentSection.category_id');
            // this.get('controllers.home.category.id');

          var newTopicData = {
            "archetype": "discette",
            "raw": firstPost,
            "title": title,
            "category": categoryId
          };

          // if (EmberENV.useApiKeys) {
          //   newTopicData.apiKey = this.get('settingsService.apiKey');
          //   newTopicData.apiUsername = this.get('settingsService.apiUsername');
          // }

          var create_post_endpoint = '/posts';
          var firstPostResult = $.ajax(create_post_endpoint, {
            data: newTopicData,
            method: 'POST'
          });
          var self = this;
          firstPostResult.then(function(result) {
              self.send('closeModal');
              self.transitionToRoute('topic', result.topic_id, result.topic_slug);
            },
            function(error) {
              // debugger;
              // self.set('serverError', error.responseJSON.errors[0]);
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              self.flash(errorMessage, 'error');
              self.set('validate', false);
            });

        }
      }

    });
  });
define("discette/controllers/start", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];


    __exports__["default"] = Ember.Controller.extend({
      actions: {
        claimNewSection: function(){
          if (this.get('newSection.name').length < 2 || this.get('newSection.description').length < 10) {
            this.set('validate', true);
            return;
          }
          var create_section_endpoint = '/drive/section/create';
          var newSectionPromise = $.ajax(create_section_endpoint, {
            data: this.get('newSection'),
            method: 'POST'
          });
          var self = this;
          newSectionPromise.then(function(result) {
              window.location.pathname = '/';
              // self.transitionToRoute('home.default');
            },
            function(error) {
              // debugger;
              // self.set('serverError', error.responseJSON.errors[0]);
              var errorMessage = "Sorry, there has been an error.  Please try again later.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              self.set('serverError', errorMessage);
            });
        },
      },
      currentSection: function() {
        var section = this.get('settingsService.currentSection');
        return section;
      }.property(),

      serverErrorValidation: function() {
        // if (!this.get('serverError')) {
        //   return;
        // }
        if (this.get('serverError')) {
          return Ember.Object.create({
            failed: true,
            reason: this.get('serverError')

          });
        }
      }.property('serverError'),

      descriptionValidation: function() {
        if (!this.get('validate')) {
          return;
        }
        if (Ember.empty('newSection.description')) {
          return Ember.Object.create({
            failed: true,
            reason: "Please enter a description."
          });
        }
        if (this.get('newSection.description').length < 10) {
          return Ember.Object.create({
            failed: true,
            reason: "Description has to be at least 10 characters long."
          });
        }
        return Ember.Object.create({
          ok: true,
          reason: "Ok"
        });
      }.property('validate', 'newSection.description'),

      nameValidation: function() {
        if (!this.get('validate')) {
          return;
        }
        if (Ember.empty('newSection.name')) {
          return Ember.Object.create({
            failed: true,
            reason: "Please enter a name."
          });
        }
        if (this.get('newSection.name').length < 2) {
          return Ember.Object.create({
            failed: true,
            reason: "Name has to be at least 2 characters long."
          });
        }
        return Ember.Object.create({
          ok: true,
          reason: "Ok"
        });
      }.property('validate', 'newSection.name'),
    });
  });
define("discette/controllers/topic", 
  ["ember","discette/models/post","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Post = __dependency2__["default"];


    __exports__["default"] = Ember.Controller.extend({
      postModels: function() {
        var postModels = [];
        var posts = this.get('model.post_stream.posts');
        posts.forEach(function(postJSON) {
          var postModel = Post.create(postJSON);
          postModels.pushObject(postModel);
          }
        );
        return postModels;
      }.property('model.post_stream.posts'),
    });
  });
define("discette/initializers/api-service", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function initialize(container, application) {
      if (EmberENV.useApiKeys) {

        // not availabe in components though..
        application.inject('route', 'apiService', 'service:api');
        application.inject('controller', 'apiService', 'service:api');
      }
    }

    __exports__.initialize = initialize;__exports__["default"] = {
      name: 'api-service',
      initialize: initialize
    };
  });
define("discette/initializers/ember-moment", 
  ["ember-moment/helpers/moment","ember-moment/helpers/ago","ember","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var moment = __dependency1__.moment;
    var ago = __dependency2__.ago;
    var Ember = __dependency3__["default"];

    var initialize = function(/* container, app */) {
      Ember.Handlebars.helper('moment', moment);
      Ember.Handlebars.helper('ago', ago);
    };
    __exports__.initialize = initialize;
    __exports__["default"] = {
      name: 'ember-moment',

      initialize: initialize
    };
  });
define("discette/initializers/export-application-global", 
  ["ember","discette/config/environment","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var config = __dependency2__["default"];

    function initialize(container, application) {
      var classifiedName = Ember.String.classify(config.modulePrefix);

      if (config.exportApplicationGlobal) {
        window[classifiedName] = application;
      }
    };
    __exports__.initialize = initialize;
    __exports__["default"] = {
      name: 'export-application-global',

      initialize: initialize
    };
  });
define("discette/initializers/settings-service", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function initialize(container, application) {
      // not availabe in components though..
      application.inject('route', 'settingsService', 'service:settings');
      application.inject('controller', 'settingsService', 'service:settings');
    }

    __exports__.initialize = initialize;__exports__["default"] = {
      name: 'settings-service',
      initialize: initialize
    };
  });
define("discette/models/discette", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var Discette = Ember.Object.extend({
      name: "",
      createOnServer: function(complete, error) {
        var data = JSON.parse(JSON.stringify(this) );
        var create_discette_endpoint = '/drive/admin/discette';
        return $.ajax(create_discette_endpoint, {
          type: 'POST',
          dataType: 'json',
          data: data
        }).then(function(result) {
          if (complete) {
            complete(result);
          }
        }, function(result) {
          if (error) {
            error(result);
          }
        });
      },
      updateOnServer: function(complete, error) {
        var self = this;
        var data = JSON.parse(JSON.stringify(this) );
        var update_discette_endpoint = '/drive/admin/discette/' + this.id;

        return $.ajax(update_discette_endpoint, {
          type: 'PUT',
          dataType: 'json',
          data: data
        }).then(function(result) {
          if (complete) {
            complete(result);
          }
        }, function(result) {
          if (error) {
            error(result);
          }
        });
      },
      destroyOnServer: function(complete, error) {
        var self = this;
        // var data = JSON.parse(JSON.stringify(this) );
        var delete_discette_endpoint = '/drive/admin/discette/' + this.id;

        return $.ajax(delete_discette_endpoint, {
          type: 'DELETE'
        }).then(function(result) {
          if (complete) {
            complete(result);
          }
        }, function(result) {
          // Post failed to update
          if (error) {
            error(result);
          }
        });
      }
    });


    __exports__["default"] = Discette;
  });
define("discette/models/post", 
  ["exports"],
  function(__exports__) {
    "use strict";
    // not quite sure how I'd get a ref to this same base obj
    // import PostObject from './post';

    var Post = Ember.Object.extend({
      // cookedChanged: function() {
      //   debugger;
      // }.observes('cooked'),
      cookedContent: function() {
        return this.get('cooked');
      }.property('cooked'),
      destroy: function(complete, error) {
        var self = this;

        // return Discourse.ajax("/posts/" + this.get('id'), {
        //   data: { context: window.location.pathname },
        //   type: 'DELETE'
        // });

        return $.ajax("/posts/" + (this.get('id')), {
          type: 'DELETE',
          dataType: 'json'
        }).then(function(result) {
          if (complete) {
            complete(result);
          }
        }, function(result) {
          // seems to get here on success...
          if (result.status === 200) {
            if (complete) {
              complete(result);
            }
          } else {
            if (error) {
              error(result);
            }
          }
        });


      },
      save: function(complete, error) {
        // var tt = PostObject.create({});
        // debugger;

        var self = this;
        if (!this.get('newPost')) {

          // We're updating a post
          return $.ajax("/posts/" + (this.get('id')), {
            type: 'PUT',
            dataType: 'json',
            data: {
              post: {
                raw: this.get('raw'),
                edit_reason: this.get('editReason')
              },
              image_sizes: this.get('imageSizes')
            }
          }).then(function(result) {
            // If we received a category update, update it
            self.set('version', result.post.version);
            // if (result.category) Discourse.Site.current().updateCategory(result.category);
            // if (complete) complete(PostObject.create(result.post))
            // not quite sure how I'd get a ref to this same base obj to use above
            if (complete) {
              complete(result.post);
            }
          }, function(result) {
            // Post failed to update
            if (error) {
              error(result);
            }
          });


        } else {

          // We're saving a post
          // var data = this.getProperties(Discourse.Composer.serializedFieldsForCreate());
          // data.reply_to_post_number = this.get('reply_to_post_number');
          // data.image_sizes = this.get('imageSizes');

          // var metaData = this.get('metaData');
          // // Put the metaData into the request
          // if (metaData) {
          //   data.meta_data = {};
          //   Ember.keys(metaData).forEach(function(key) {
          //     data.meta_data[key] = metaData.get(key);
          //   });
          // }

          // return Discourse.ajax("/posts", {
          //   type: 'POST',
          //   data: data
          // }).then(function(result) {
          //   // Post created
          //   if (complete) complete(Discourse.Post.create(result));
          // }, function(result) {
          //   // Failed to create a post
          //   if (error) error(result);
          // });
        }
      }
    });

    __exports__["default"] = Post;
  });
define("discette/models/section", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var Section = Ember.Object.extend({
      createOnServer: function(complete, error) {
        var data = JSON.parse(JSON.stringify(this) );
        var create_section_endpoint = '/drive/admin/section';
        return $.ajax(create_section_endpoint, {
          type: 'POST',
          dataType: 'json',
          data: data
        }).then(function(result) {
          if (complete) {
            complete(result);
          }
        }, function(result) {
          if (error) {
            error(result);
          }
        });
      },
      updateOnServer: function(complete, error) {
        var self = this;
        var data = JSON.parse(JSON.stringify(this) );
        var update_section_endpoint = '/drive/admin/section/' + this.id;

        return $.ajax(update_section_endpoint, {
          type: 'PUT',
          dataType: 'json',
          data: data
        }).then(function(result) {
          if (complete) {
            complete(result);
          }
        }, function(result) {
          // Post failed to update
          if (error) {
            error(result);
          }
        });
      }
    });

    // Section.reopenClass({
    //   getRootUrl: function(collection, klass) {
    //     var retval = {};
    //     if (Ember.isEmpty(collection)) { return retval; }

    //     collection.forEach(function(item) {
    //       retval[item.id] = klass.create(item);
    //     });
    //     return retval;
    //   }
    // });



    __exports__["default"] = Section;
  });
define("discette/models/topic", 
  ["ember-data","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var DS = __dependency1__["default"];

    __exports__["default"] = DS.Model.extend({
      
    });
  });
define("discette/models/user", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var User = Ember.Object.extend( {
      avatarUrl: function(){
      	return this.get('rootUrl') + this.get('avatar_template').replace(/\{size\}/g, '32');
      }.property()
    });

    __exports__["default"] = User;
  });
define("discette/router", 
  ["ember","discette/config/environment","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var config = __dependency2__["default"];

    // https://gist.github.com/machty/8413411
    // Extend Ember.Route to add support for sensible
    // document.title integration.
    Ember.Route.reopen({

      // `titleToken` can either be a static string or a function
      // that accepts a model object and returns a string (or array
      // of strings if there are multiple tokens).
      titleToken: null,

      // `title` can either be a static string or a function
      // that accepts an array of tokens and returns a string
      // that will be the document title. The `collectTitleTokens` action
      // stops bubbling once a route is encountered that has a `title`
      // defined.
      title: null,

      // Provided by Ember
      _actions: {
        collectTitleTokens: function(tokens) {
          var titleToken = this.titleToken;
          if (typeof this.titleToken === 'function') {
            titleToken = this.titleToken(this.currentModel);
          }

          if (Ember.isArray(titleToken)) {
            tokens.unshift.apply(this, titleToken);
          } else if (titleToken) {
            tokens.unshift(titleToken);
          }

          // If `title` exists, it signals the end of the
          // token-collection, and the title is decided right here.
          if (this.title) {
            var finalTitle;
            if (typeof this.title === 'function') {
              finalTitle = this.title(tokens);
            } else {
              // Tokens aren't even considered... a string
              // title just sledgehammer overwrites any children tokens.
              finalTitle = this.title;
            }

            // Stubbable fn that sets document.title
            this.router.setTitle(finalTitle);
          } else {
            // Continue bubbling.
            return true;
          }
        }
      }
    });

    Ember.Router.reopen({
      updateTitle: function() {
        this.send('collectTitleTokens', []);
      }.on('didTransition'),

      setTitle: function(title) {
        if (Ember.testing) {
          this._title = title;
        } else {
          window.document.title = title;
        }
      }
    });

    var Router = Ember.Router.extend({
      location: config.locationType
    });

    Router.map(function() {
      this.route("start");
      this.route("micro-forums");
      // this.route("about-section");
      // this.route("manage-section");

      this.resource("overview", {
        path: "directory"
      }, function() {
        this.route("default", {
          path: "/"
        });
      });

      this.resource("drive-admin", {
        path: "drive-admin"
      }, function() {
        this.route("default", {
          path: "/"
        });
        this.resource("drive-admin.sections", {
          path: "/sections"
        }, function(){
          this.route("default",{
            path: "/"
          });
          this.route("details",{
            path: "/:id"
          });
        });
        this.resource("drive-admin.discettes", {
          path: "/discettes"
        }, function(){
          this.route("default",{
            path: "/"
          });
          this.route("details",{
            path: "/:id"
          });
        });
      });

      this.resource("home", {
        path: "home"
      }, function() {
        this.route("default", {
          path: "/"
        });
        this.route("about", {
          path: "/about"
        });
        this.route("manage", {
          path: "/manage"
        });
      });


      this.resource("topic", {
        path: "d/:id/:slug"
      }, function() {
        this.route("default", {
          path: "/"
        });
      });
    });

    __exports__["default"] = Router;
  });
define("discette/routes/application", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    var ApplicationRoute;

    ApplicationRoute = Ember.Route.extend({
      title: function(tokens) {
        var sectionName = this.controller.get('currentSection.name');
        if (tokens && tokens.length > 0) {
          return tokens.join('-') + ' - ' + sectionName;
        } else{
          return sectionName;
        }
      },
      beforeModel: function() {
        // debugger;
        if (!EmberENV.disableCSRF) {
          return this.csrf.fetchToken();
        }
      },
      actions: {
        openModal: function(modal, model) {
          if (model) {
            this.controllerFor(modal).set('model', model);
          }
          return this.render(modal, {
            into: 'application',
            outlet: 'modal'
          });
        },
        closeModal: function() {
          return this.disconnectOutlet({
            outlet: 'modal',
            parentView: 'application'
          });
        },
        showLogIn: function() {
          // this.sendAction('openModalAction', 'modal/log_in');
          //setting this cookie ensures I will be redirected here after signup
          $.cookie('destination_url', location.href);
          var rootDomainBaseUrl = PreloadStore.get('discetteSettings.rootDomainBaseUrl') || 'http://klavado.com';
          window.location = rootDomainBaseUrl + "/login";
        }

      }
    });

    __exports__["default"] = ApplicationRoute;
  });
define("discette/routes/drive-admin", 
  ["ember","discette/models/section","discette/models/discette","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Section = __dependency2__["default"];
    var Discette = __dependency3__["default"];


    __exports__["default"] = Ember.Route.extend({
      actions: {
        sectionCreateSuccess: function(section){
          debugger;
          this.transitionTo('drive-admin.sections.details', section.id);
        },
        discetteCreateSuccess: function(discette){
          this.transitionTo('drive-admin.discettes.details', discette.id);
        },
        discetteDeleteSuccess: function(){
          this.transitionTo('drive-admin.discettes.default');
        }

        // deleteSection: function(section) {
        //   var delete_section_endpoint = '/drive/admin/section/' + section.id;
        //   var deleteSectionPromise = $.ajax(delete_section_endpoint, {
        //     method: 'DELETE'
        //   });
        //   var self = this;
        //   deleteSectionPromise.then(function(result) {},
        //     function(error) {});
        // },
        // deleteDiscette: function(discette) {
        //   var delete_discette_endpoint = '/drive/admin/discette/' + discette.id;
        //   var deleteDiscettePromise = $.ajax(delete_discette_endpoint, {
        //     method: 'DELETE'
        //   });
        //   var self = this;
        //   deleteDiscettePromise.then(function(result) {},
        //     function(error) {});
        // }
      },
      model: function(params) {
        var apiUrl = "/drive/admin/sections";
        var topics = $.getJSON(apiUrl).then(
          function(result) {
            return result;
          });
        return topics;
      },
      setupController: function(controller, model) {
        controller.set('model', model);
        controller.set('newSection', Section.create({
          isNew: true
        }));
        controller.set('newDiscette', Discette.create({
          isNew: true
        }));
      }
    });
  });
define("discette/routes/drive-admin/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({

      beforeModel: function() {
        this.transitionTo('drive-admin.sections');
      }

    });
  });
define("discette/routes/drive-admin/discettes/details", 
  ["ember","discette/models/discette","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Disc = __dependency2__["default"];

    __exports__["default"] = Ember.Route.extend({

      model: function(params) {
        var apiUrl = "/drive/admin/discette/" + params.id;
        var topics = $.getJSON(apiUrl).then(
          function(result) {
            return result;
          });
        return topics;
      },
      setupController: function(controller, model) {
        var disc = Disc.create(model.discette);
        controller.set('model', disc);
        // var discettes = this.modelFor('drive-admin').discettes;
        // controller.set('discettes',discettes);
      }

    });
  });
define("discette/routes/drive-admin/sections/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({

      setupController: function(controller, model) {
        controller.set('model', model);
        // model for drive-admin gets passed through by default
        // var discettes = this.modelFor('drive-admin').discettes;
        // controller.set('discettes',discettes);
      }

    });
  });
define("discette/routes/drive-admin/sections/details", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({

      model: function(params) {
        var apiUrl = "/drive/admin/section/" + params.id;
        var topics = $.getJSON(apiUrl).then(
          function(result) {
            return result;
          });
        return topics;
      },
      setupController: function(controller, model) {
        controller.set('model', model);
        var discettes = this.modelFor('drive-admin').discettes;
        controller.set('discettes',discettes);
      }

    });
  });
define("discette/routes/home", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({
      beforeModel: function() {
        if (this.get('settingsService.currentSection.status') === "unclaimed") {
          this.transitionTo('start');
        }
      },
      actions: {
        startNewTopic: function() {
          var currentUser = this.controllerFor('application').get('currentUser');
          if (currentUser) {
            this.send('openModal', 'modal/new_topic');
          } else {
            this.send('showLogIn');
          }
        }
      },
      model: function(params) {
        // if (PreloadStore.data.discette_topics) {
        //  return PreloadStore.data.discette_topics;
        // }
        var apiUrl = "/drive/section/topics";
        var topics = $.getJSON(apiUrl).then(
          function(result) {
            return result;
          });
        return topics;
      },
    });
  });
define("discette/routes/home/about", 
  ["discette/models/post","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Post = __dependency1__["default"];
    // import Ember from 'ember';

    __exports__["default"] = Ember.Route.extend({
      actions: {
        cancelReplyToTopic: function() {
          this.controller.set('isCommenting', false);
        },
        cancelPrimaryPostEdit: function() {
          this.controller.set('isEditingPrimaryPost', false);
        },
        startEditingPrimaryPost: function() {
          var currentUser = this.controllerFor('application').get('currentUser');
          if (currentUser) {
            this.controller.set('isEditingPrimaryPost', true);
            this.controller.set('isCommenting', false);
            var postApiUrl = "/posts/" + this.controller.get('primaryPost.id') + ".json";
            var that = this;
            var post = $.getJSON(postApiUrl).then(
              function(detailedPost) {
                that.controller.set('primaryPostWithRaw', detailedPost);
              });
          } else {
            this.send('showLogIn');
          }
        },
        startCommentOnSection: function() {
          var currentUser = this.controllerFor('application').get('currentUser');
          if (currentUser) {
            this.controller.set('isCommenting', true);
            this.controller.set('isEditingPrimaryPost', false);
          } else {
            this.send('showLogIn');
          }
        },
        processSectionComment: function() {
          var topic_id = this.controller.get('model.topic.id');
          var category_id = this.controller.get('model.topic.category_id');
          var draft = this.controller.get('model.draft');
          var replyData = {
            "raw": draft,
            "topic_id": topic_id,
            "archetype": "discette",
            "category": category_id
          };

          // if (EmberENV.useApiKeys) {
          //   // replyData.apiKey = this.get('settingsService.apiKey');
          //   // replyData.apiUsername = this.get('settingsService.apiUsername');
          // }

          var create_post_endpoint = '/posts';
          var reply = $.ajax(create_post_endpoint, {
            data: replyData,
            method: 'POST'

          });
          var that = this;
          reply.then(function(result) {
              that.controller.set('isCommenting', false);
              var comments = that.controller.get('comments');
              comments.pushObject(Post.create(result));
            },
            function(error) {
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              that.controller.set('commentServerError', errorMessage);
            });

        },
        updatePrimaryPost: function() {
          var topic_id = this.controller.get('model.topic.id');
          var category_id = this.controller.get('model.topic.category_id');
          var updatedPost = this.controller.get('primaryPostWithRaw.raw');

          var replyData = {
            "post": {
              "raw": updatedPost,
              "edit_reason": ""
            },
            "topic_id": topic_id,
            "archetype": "discette",
            "category": category_id
          };

          // if (EmberENV.useApiKeys) {
          //   replyData.apiKey = this.get('settingsService.apiKey');
          //   replyData.apiUsername = this.get('settingsService.apiUsername');
          // }

          var update_post_endpoint = '/posts/' + this.controller.get('primaryPost.id');
          var reply = $.ajax(update_post_endpoint, {
            data: replyData,
            method: 'PUT'

          });
          var that = this;
          reply.then(function(result) {
              that.controller.set('isEditingPrimaryPost', false);
              that.controller.set('primaryPost', result.post);
            },
            function(error) {
              var errorMessage = "Sorry, there has been an error.";
              if (error.responseJSON && error.responseJSON.errors) {
                errorMessage = error.responseJSON.errors[0];
              }
              that.controller.set('primaryPostServerError', errorMessage);
            });


        }
      },
      model: function() {
        var apiUrl = "/drive/section/about";
        var result = $.getJSON(apiUrl).then(
          function(aboutJson) {
            return aboutJson;
          });
        return result;
      },
      setupController: function(controller, model) {
        if (model.section_status && model.section_status === "unclaimed") {
          this.transitionTo('start');
        }
        // TODO - move above to before model which checks preloaded json
        controller.set('model', model);
        controller.set('isCommenting', false);
      }
    });
  });
define("discette/routes/home/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({
      actions: {},

      beforeModel: function() {
        // TODO check preloaded data - if section is not claimed, redirect to 'setup' route
        // this.transitionTo('set_up');
      },

      setupController: function(controller, model) {
        // model = this.modelFor('home');
        if (model.section_status && model.section_status === "unclaimed") {
          controller.set('model', []);
        } else {
          controller.set('model', model.discette_topics);
          if (model.discette_topics.length < 1) {
            controller.set('noTopics', true);
          }
          // controller.set('aboutTopic', model.about_topic);
          // should be safe to remove below:
          controller.set('category', model.category);
        }
      }
    });
  });
define("discette/routes/home/manage", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({
      actions: {

      },
      model: function(params) {
        var apiUrl = "/drive/section/current";
        var topics = $.getJSON(apiUrl).then(
          function(result) {
            return result;
          });
        return topics;
      },
      setupController: function(controller, model) {
        controller.set('model', model);
      }
    });
  });
define("discette/routes/index", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({

      beforeModel: function() {
      	if(this.get('settingsService.currentSection.status') === "unclaimed"){
      		this.transitionTo('start');
      	}
      	else{
          this.transitionTo('home');
      	}
      }

    });
  });
define("discette/routes/micro-forums", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({
      beforeModel: function() {
        if (this.get('settingsService.currentSection.status') === "unclaimed") {
          this.transitionTo('start');
        }
        else{
          this.transitionTo('home');
        }
      }
    });
  });
define("discette/routes/overview/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({
      actions: {

      },
      model: function(params) {
        var apiUrl = "/drive/section/directory";
        var topics = $.getJSON(apiUrl).then(
          function(result) {
            return result;
          });
        return topics;
      },
      setupController: function(controller, model) {
        controller.set('model', model);
        controller.set('newSection', {});
        controller.set('newDiscette', {});
      }
    });
  });
define("discette/routes/start", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.Route.extend({
      setupController: function(controller, model) {
        var currentSection = this.get('settingsService.currentSection');
        controller.set('model', currentSection);
        controller.set('newSection', {
        	description: '',
        	name: ''
        });
        if (currentSection.status === "unclaimed") {
          controller.set('isAvailable', true);
        }
      },
    });
  });
define("discette/routes/topic", 
  ["ember","discette/config/environment","discette/models/topic","discette/models/post","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var ENV = __dependency2__["default"];
    // not quite sure how to access above..
    var Topic = __dependency3__["default"];
    var Post = __dependency4__["default"];

    __exports__["default"] = Ember.Route.extend({
      titleToken: function(){
        return this.controller.get('model.title');
      },
      actions: {
        startNewTopic: function() {
          var currentUser = this.controllerFor('application').get('currentUser');
          if (currentUser) {
            this.send('openModal', 'modal/new_topic');
          } else {
            this.send('showLogIn');
          }
        },
        cancelReplyToTopic: function() {
          this.controller.set('isEditing', false);
        },
        startReplyToTopic: function() {
          var currentUser = this.controllerFor('application').get('currentUser');
          if (currentUser) {
            this.controller.set('isEditing', true);
          } else{
            this.send('showLogIn');
          }
        },
        processReplyToTopic: function() {
          this.controller.set('isEditing', false);
          var topic_id = this.controller.get('model.id');
          var category_id = this.controller.get('model.category_id');
          var draft = this.controller.get('model.draft');

          var replyData = {
            "raw": draft,
            "topic_id": topic_id,
            "archetype": "discette",
            "category": category_id
          };

          // if (EmberENV.useApiKeys) {
          //   replyData.apiKey = this.get('settingsService.apiKey');
          //   replyData.apiUsername = this.get('settingsService.apiUsername');
          // }

          var create_post_endpoint = '/posts';
          var reply = $.ajax(create_post_endpoint, {
            data: replyData,
            method: 'POST'

          });
          var that = this;
          reply.then(function(result) {
              var postModels = that.controller.get('postModels');
              // var postStreamPosts = that.controller.get('model.post_stream.posts');
              // postStreamPosts.pushObject(result);
              postModels.pushObject(Post.create(result));
            },
            function(error) {
              // TODO - handle errors
            });

        }
      },
      model: function(params) {
        // var topic = this.store.find('topic', params.id);
        // var apiUrl = "/api/topics/3";
        var apiUrl = "/t/" + params.slug + "/" + params.id + ".json" + "?include_raw=true";
        var topic = $.getJSON(apiUrl).then(
          function(detailedTopic) {
            return detailedTopic;
          });
        return topic;
      },
      setupController: function(controller, model) {
        //TODO - create topic from topic model
        // var topic = Topic.create(model);
        controller.set('model', model);
        controller.set('isEditing', false);
      }
    });
  });
define("discette/services/api", 
  ["ember","discette/models/section","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Section = __dependency2__["default"];

    __exports__["default"] = Ember.Object.extend({
    	apiKey: '9130cf8d35adddc65379459a47113d9fb25803711498a50203b31cd060f42258',
    	apiUsername: 'LarrisaW',

    });
  });
define("discette/services/settings", 
  ["ember","discette/models/section","discette/models/user","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Section = __dependency2__["default"];
    var User = __dependency3__["default"];

    __exports__["default"] = Ember.Object.extend({
    	 currentUser: function() {
        var userJson = PreloadStore.get('currentUser');
         // this.get('settingsService.currentSection.rootUrl');
        // PreloadStore.get('discetteSettings.rootDomainBaseUrl') || 'http://klavado.com';
        if (userJson) {
        // TODO: fix below
          userJson.rootUrl = 'http://klavado.com';
          return User.create(userJson);
        }
        return null;
      }.property(),
    	currentSection: function(){
    		var sectionModel = Section.create(PreloadStore.get('currentSection'));
    		return sectionModel;
    	}.property()
    });
  });
define("discette/templates/application", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push("\n");
      data.buffer.push(escapeExpression((helper = helpers['discette-header'] || (depth0 && depth0['discette-header']),options={hash:{
        'openModalAction': ("openModal"),
        'showLogInAction': ("showLogIn"),
        'currentUser': ("currentUser"),
        'currentSection': ("currentSection")
      },hashTypes:{'openModalAction': "STRING",'showLogInAction': "STRING",'currentUser': "ID",'currentSection': "ID"},hashContexts:{'openModalAction': depth0,'showLogInAction': depth0,'currentUser': depth0,'currentSection': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "discette-header", options))));
      data.buffer.push("\n\n<div class=\"container discette-main\" style=\"margin-top: 40px;\">\n  ");
      stack1 = helpers._triageMustache.call(depth0, "outlet", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n</div>\n\n\n");
      data.buffer.push(escapeExpression((helper = helpers.outlet || (depth0 && depth0.outlet),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "modal", options) : helperMissing.call(depth0, "outlet", "modal", options))));
      data.buffer.push("\n\n");
      return buffer;
      
    });
  });
define("discette/templates/components/content-composer", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push("    <div class=\"row reply-row\">\n      <div class='col-md-10 col-sm-12'>\n        <div class=\"pagedown-container bottom-round\">\n        ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("composerValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n\n        ");
      data.buffer.push(escapeExpression((helper = helpers.textarea || (depth0 && depth0.textarea),options={hash:{
        'classNames': ("pgdn-textarea form-control"),
        'value': ("content")
      },hashTypes:{'classNames': "STRING",'value': "ID"},hashContexts:{'classNames': depth0,'value': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "textarea", options))));
      data.buffer.push("\n        </div>\n      </div>\n      <div class='col-md-2 col-sm-12'>\n        <div style=\"margin-top:3%\">\n          <button class='btn btn-primary' style=\"width: 100%;margin-bottom:10px;\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "save", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n            Save\n          </button>\n          <button class='btn' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancel", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n            Cancel\n          </button>\n        </div>\n      </div>\n    </div>");
      return buffer;
      
    });
  });
define("discette/templates/components/discette-form", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

    function program1(depth0,data) {
      
      
      data.buffer.push("\n <h4>Create Discette:</h4>\n  ");
      }

    function program3(depth0,data) {
      
      
      data.buffer.push("\n <h4>Edit Discette:</h4>\n");
      }

    function program5(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n  <div class=\"form-buttons\">\n    <button class='btn btn-primary'  ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "createDiscette", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n      Create\n    </button>\n  </div>\n\n  ");
      return buffer;
      }

    function program7(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n    <div class=\"form-buttons\">\n      <button class='btn btn-primary'  ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "updateDiscette", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n        Update\n      </button>\n      <button class='btn btn-danger' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "deleteDiscette", "discette", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
      data.buffer.push(" style=\"\">\n        Delete\n      </button>\n    </div>\n");
      return buffer;
      }

      stack1 = helpers['if'].call(depth0, "discette.isNew", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  <form>\n\n    <div style=\"width: 50%;\" class=\"form-group\">\n      <div>\n        <div style=\"\" class=\"\">\n          <label for='topic-title'>\n            Discette Name:\n          </label>\n        </div>\n      </div>\n      <div class=\"input\">\n        <div style=\"\">\n          ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("discette.name"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("nameValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n        </div>\n      </div>\n\n      <div class=\"\" style=\"margin-top: 15px;\">\n        <div>\n          <label>\n            Slug:\n          </label>\n        </div>\n      </div>\n      <div class=\"input\">\n        <div class=\"\">\n          ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("discette.slug"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push("\n        </div>\n      </div>\n\n\n      <div class=\"\" style=\"margin-top: 15px;\">\n        <div>\n          <label>\n            Description:\n          </label>\n        </div>\n      </div>\n      <div class=\"input\">\n        <div class=\"\">\n          ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("discette.description"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push("\n        </div>\n      </div>\n\n      <div class=\"tip bad\">");
      stack1 = helpers._triageMustache.call(depth0, "serverError", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</div>\n      <div class=\"tip good\">");
      stack1 = helpers._triageMustache.call(depth0, "successMessage", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</div>\n\n    </div>\n\n\n");
      stack1 = helpers['if'].call(depth0, "discette.isNew", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n\n  </form>\n\n");
      return buffer;
      
    });
  });
define("discette/templates/components/discette-header", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

    function program1(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push(" ");
      stack1 = helpers._triageMustache.call(depth0, "currentSection.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" ");
      return buffer;
      }

    function program3(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n          <li class='current-user dropdown'>\n            <a class='icon'\n               data-dropdown=\"user-dropdown\"\n               data-render=\"renderUserDropdown\"\n               href=\"#\"\n               title='me'\n               id=\"current-user\">\n               <img width=\"32\" height=\"32\" ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'src': ("currentUser.avatarUrl"),
        'title': ("currentUser.username")
      },hashTypes:{'src': "STRING",'title': "STRING"},hashContexts:{'src': depth0,'title': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" class=\"avatar\">\n            </a>\n          </li>\n          ");
      return buffer;
      }

    function program5(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n          <button ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "showSignUp", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" class='btn btn-primary btn-small sign-up-button navbar-btn'>\n            Sign Up\n          </button>\n          <button ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "showLogIn", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" class='btn btn-primary btn-small login-button navbar-btn'>\n            Log In\n          </button>\n        ");
      return buffer;
      }

      data.buffer.push("\n<nav class=\"navbar navbar-default navbar-fixed-top\" role=\"navigation\">\n  <div class=\"container\">\n    <div class=\"navbar-header\">\n      <button type=\"button\" class=\"navbar-toggle collapsed\" data-toggle=\"collapse\" data-target=\"#bs-example-navbar-collapse-1\">\n        <span class=\"sr-only\">Toggle navigation</span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n      </button>\n\n      <div class=\"navbar-brand\" id='title'>\n      <span style=\"margin:0px\">        ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "home", options) : helperMissing.call(depth0, "link-to", "home", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n      </span>  \n      <span class=\"navbar-banner\"> : micro-forums made easy</span>\n\n      </div>\n\n    </div>\n\n\n\n\n    <!-- Collect the nav links, forms, and other content for toggling -->\n    <div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-1\">\n\n      <ul class=\"nav navbar-nav navbar-right\">\n        ");
      stack1 = helpers['if'].call(depth0, "signedIn", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n");
      data.buffer.push(escapeExpression((helper = helpers.render || (depth0 && depth0.render),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "user-dropdown", options) : helperMissing.call(depth0, "render", "user-dropdown", options))));
      data.buffer.push("\n\n      </ul>\n      \n    </div>\n  </div>\n</nav>\n\n\n<div class='container'>\n  <div class='contents clearfix'>\n\n\n\n\n  </div>\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/components/pagedown-bootstrap", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push(escapeExpression((helper = helpers.textarea || (depth0 && depth0.textarea),options={hash:{
        'classNames': ("pgdn-textarea form-control"),
        'value': ("content"),
        'tabindex': ("1")
      },hashTypes:{'classNames': "STRING",'value': "ID",'tabindex': "STRING"},hashContexts:{'classNames': depth0,'value': depth0,'tabindex': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "textarea", options))));
      
    });
  });
define("discette/templates/components/post-details", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var stack1, escapeExpression=this.escapeExpression, functionType="function", helperMissing=helpers.helperMissing, self=this;

    function program1(depth0,data) {
      
      var buffer = '', stack1, helper, options;
      data.buffer.push("\n<div class='topic-post'>\n  <article ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'class': (":boxed via_email"),
        'id': ("postElementId"),
        'data-post-id': ("id"),
        'data-user-id': ("user_id")
      },hashTypes:{'class': "STRING",'id': "STRING",'data-post-id': "STRING",'data-user-id': "STRING"},hashContexts:{'class': depth0,'id': depth0,'data-post-id': depth0,'data-user-id': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(">\n    <div class='row'>\n\n      <div class='topic-meta-data topic-avatar col-md-1 col-sm-2 col-xs-12'>\n\n        <div class=\"contents\">\n          <a ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'href': ("usernameUrl"),
        'data-user-card': ("postModel.username")
      },hashTypes:{'href': "STRING",'data-user-card': "STRING"},hashContexts:{'href': depth0,'data-user-card': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" classnames=\"trigger-user-card main-avatar\">\n            <img width=\"45\" height=\"45\" ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'src': ("avatarUrl"),
        'title': ("postModel.username")
      },hashTypes:{'src': "STRING",'title': "STRING"},hashContexts:{'src': depth0,'title': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" class=\"avatar\">\n          </a>\n        </div>\n        <div class=\"poster-name pull-left\">\n          ");
      data.buffer.push(escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.postModel)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)));
      data.buffer.push("\n        </div>\n\n      </div>\n\n      <div class='col-md-10 col-sm-10 col-xs-12'>\n        <div class='topic-body'>\n          <div class='bottom-round contents regular'>\n\n            <div class='post-info pull-right'>\n              <span class=\"faded\" ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'title': ("longCreatedAt")
      },hashTypes:{'title': "STRING"},hashContexts:{'title': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" data-format=\"tiny\">");
      data.buffer.push(escapeExpression((helper = helpers.ago || (depth0 && depth0.ago),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data},helper ? helper.call(depth0, "postModel.created_at", options) : helperMissing.call(depth0, "ago", "postModel.created_at", options))));
      data.buffer.push(" </span> \n              <a class='post-date' ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'href': ("shareUrl"),
        'data-share-url': ("shareUrl"),
        'data-post-number': ("post_number")
      },hashTypes:{'href': "STRING",'data-share-url': "STRING",'data-post-number': "STRING"},hashContexts:{'href': depth0,'data-share-url': depth0,'data-post-number': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(">\n              </a>\n            </div>\n            <div class=\"cooked\">\n              ");
      data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "postModel.cookedContent", {hash:{
        'unescaped': ("true")
      },hashTypes:{'unescaped': "STRING"},hashContexts:{'unescaped': depth0},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push("\n            </div>\n           ");
      stack1 = helpers['if'].call(depth0, "postModel.can_delete", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(2, program2, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n            ");
      stack1 = helpers['if'].call(depth0, "postModel.can_edit", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n          </div>\n        </div>\n      </div>\n\n    </div>\n  </article>\n\n\n</div>\n\n");
      return buffer;
      }
    function program2(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n              <span class='btn pull-right' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startDeletingPost", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n                <i class=\"fa fa-trash\"></i>Delete\n              </span> \n            ");
      return buffer;
      }

    function program4(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n              <span class='btn pull-right' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startEditingPost", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n                <i class=\"fa fa-pencil\"></i>Edit\n              </span> \n            ");
      return buffer;
      }

      stack1 = helpers['if'].call(depth0, "isVisible", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      else { data.buffer.push(''); }
      
    });
  });
define("discette/templates/components/section-form", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

    function program1(depth0,data) {
      
      
      data.buffer.push("\n <h4>Create Section:</h4>\n  ");
      }

    function program3(depth0,data) {
      
      
      data.buffer.push("\n <h4>Edit Section:</h4>\n");
      }

    function program5(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n  <div class=\"form-buttons\">\n    <button class='btn btn-primary'  ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "createSection", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n      Create\n    </button>\n  </div>\n\n  ");
      return buffer;
      }

    function program7(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n    <div class=\"form-buttons\">\n      <button class='btn btn-primary'  ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "updateSection", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n        Update\n      </button>\n      <button class='btn btn-danger' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "deleteSection", "section", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
      data.buffer.push(" style=\"\">\n        Delete\n      </button>\n    </div>\n");
      return buffer;
      }

      stack1 = helpers['if'].call(depth0, "section.isNew", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  <form>\n    <div style=\"width: 50%;\" class=\"form-group\">\n      <div>\n        <div style=\"\" class=\"\">\n          <label for='topic-title'>\n            Name:\n          </label>\n        </div>\n      </div>\n      <div class=\"input\">\n        <div style=\"\">\n          ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("section.name"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("nameValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n        </div>\n      </div>\n\n      <div class=\"\" style=\"margin-top: 15px;\">\n        <div>\n          <label>\n            Subdomain Lower:\n          </label>\n        </div>\n      </div>\n      <div class=\"input\">\n        <div class=\"\">\n          ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("section.subdomain_lower"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push("\n        </div>\n      </div>\n\n      <div class=\"\" style=\"margin-top: 15px;\">\n        <div>\n          <label>\n            Discette:\n          </label>\n        </div>\n      </div>\n      <div class=\"input\">\n        <div class=\"\">\n          ");
      data.buffer.push(escapeExpression(helpers.view.call(depth0, "select", {hash:{
        'content': ("controller.discettes"),
        'optionValuePath': ("content.id"),
        'optionLabelPath': ("content.name"),
        'selection': ("section.discette")
      },hashTypes:{'content': "ID",'optionValuePath': "STRING",'optionLabelPath': "STRING",'selection': "ID"},hashContexts:{'content': depth0,'optionValuePath': depth0,'optionLabelPath': depth0,'selection': depth0},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push("\n        </div>\n      </div>\n\n      <div class=\"\" style=\"margin-top: 15px;\">\n        <div>\n          <label>\n            Category Id:\n          </label>\n        </div>\n      </div>\n      <div class=\"input\">\n        <div class=\"\">\n          ");
      data.buffer.push(escapeExpression(helpers.view.call(depth0, "select", {hash:{
        'content': ("model.categories"),
        'optionValuePath': ("content.id"),
        'optionLabelPath': ("content.name"),
        'selection': ("section.category")
      },hashTypes:{'content': "ID",'optionValuePath': "STRING",'optionLabelPath': "STRING",'selection': "ID"},hashContexts:{'content': depth0,'optionValuePath': depth0,'optionLabelPath': depth0,'selection': depth0},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push("\n        </div>\n      </div>\n\n      <div class=\"\" style=\"margin-top: 15px;\">\n        <div>\n          <label>\n            Users:\n          </label>\n        </div>\n      </div>\n\n      <div class=\"tip bad\">");
      stack1 = helpers._triageMustache.call(depth0, "serverError", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</div>\n      <div class=\"tip good\">");
      stack1 = helpers._triageMustache.call(depth0, "successMessage", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</div>\n\n    </div>\n\n");
      stack1 = helpers['if'].call(depth0, "section.isNew", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n\n  </form>\n\n");
      return buffer;
      
    });
  });
define("discette/templates/components/section-overview", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var stack1, escapeExpression=this.escapeExpression, self=this;

    function program1(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n  \n  <div class=\"row\">\n    <div class=\"faded\" >\n      This Mini-Forum was created on ");
      stack1 = helpers._triageMustache.call(depth0, "createdAt", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" by <a ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'href': ("usernameUrl"),
        'data-user-card': ("sectionOwner.username")
      },hashTypes:{'href': "STRING",'data-user-card': "STRING"},hashContexts:{'href': depth0,'data-user-card': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" classnames=\"trigger-user-card main-avatar\">");
      stack1 = helpers._triageMustache.call(depth0, "sectionOwner.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</a>\n    </div>\n  </div>\n\n  ");
      return buffer;
      }

    function program3(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n\n<div class='section-overview'>\n  <article ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'class': (":boxed via_email"),
        'id': ("postElementId"),
        'data-post-id': ("id"),
        'data-user-id': ("user_id")
      },hashTypes:{'class': "STRING",'id': "STRING",'data-post-id': "STRING",'data-user-id': "STRING"},hashContexts:{'class': depth0,'id': depth0,'data-post-id': depth0,'data-user-id': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(">\n    <div class='row'>\n\n      <div class='topic-meta-data topic-avatar col-md-1 col-sm-2 col-xs-12'>\n\n        <div class=\"contents\">\n          <a ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'href': ("usernameUrl"),
        'data-user-card': ("sectionOwner.username")
      },hashTypes:{'href': "STRING",'data-user-card': "STRING"},hashContexts:{'href': depth0,'data-user-card': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" classnames=\"trigger-user-card main-avatar\">\n            <img width=\"45\" height=\"45\" ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'src': ("avatarUrl"),
        'title': ("sectionOwner.username")
      },hashTypes:{'src': "STRING",'title': "STRING"},hashContexts:{'src': depth0,'title': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" class=\"avatar\">\n          </a>\n        </div>\n        <div class=\"poster-name pull-left\">\n          ");
      stack1 = helpers._triageMustache.call(depth0, "sectionOwner.username", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n        </div>\n\n      </div>\n\n      <div class='col-md-10 col-sm-10 col-xs-12'>\n        <a ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'href': ("sectionUrl")
      },hashTypes:{'href': "STRING"},hashContexts:{'href': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" >\n          <div class=\"row\">\n            <div class=\"col-sm-4\">\n              <h5 style=\"font-weight: bold;\">");
      stack1 = helpers._triageMustache.call(depth0, "section.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</h5> ");
      stack1 = helpers._triageMustache.call(depth0, "sectionUrl", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" \n            </div>\n            <div class=\"col-sm-2\">\n              <span style=\"font-weight: bold;\">Discette slug:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.discette_slug", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n            </div>\n            <div class=\"col-sm-2\">\n              <span style=\"font-weight: bold;\">Category slug:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category_slug", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n            </div>\n            <div class=\"col-sm-2\">\n              <span style=\"font-weight: bold;\">Category name:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category_name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n            </div>\n\n            <div class=\"col-sm-2\">\n            </div>\n          </div>\n        </a>\n\n      </div>\n\n    </div>\n  </article>\n</div>\n\n\n");
      return buffer;
      }

      stack1 = helpers['if'].call(depth0, "summaryView", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      else { data.buffer.push(''); }
      
    });
  });
define("discette/templates/components/summer-note", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push(escapeExpression((helper = helpers.textarea || (depth0 && depth0.textarea),options={hash:{
        'classNames': ("wysiwyg-textarea form-control"),
        'value': ("content")
      },hashTypes:{'classNames': "STRING",'value': "ID"},hashContexts:{'classNames': depth0,'value': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "textarea", options))));
      
    });
  });
define("discette/templates/drive-admin/discettes", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

    function program1(depth0,data) {
      
      
      data.buffer.push(" Manage sections ");
      }

    function program3(depth0,data) {
      
      
      data.buffer.push(" Manage discettes ");
      }

    function program5(depth0,data) {
      
      var buffer = '', stack1, helper, options;
      data.buffer.push(" \n    ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(6, program6, data),contexts:[depth0,depth0],types:["STRING","ID"],data:data},helper ? helper.call(depth0, "drive-admin.discettes.details", "discette.id", options) : helperMissing.call(depth0, "link-to", "drive-admin.discettes.details", "discette.id", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" \n    ");
      return buffer;
      }
    function program6(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n    <div class=\"row\">\n      <div class=\"col-sm-3\">\n      <h5>");
      stack1 = helpers._triageMustache.call(depth0, "discette.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</h5>\n      </div>\n      <div class=\"col-sm-3\">\n        <span style=\"font-weight: bold;\">Slug:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "discette.slug", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n      </div>\n      <div class=\"col-sm-4\">\n        <span style=\"font-weight: bold;\">Description:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "discette.description", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n      </div>\n\n    </div>\n    ");
      return buffer;
      }

      data.buffer.push("<div class=\"row\" style=\"\">\n\n  <div class=\"\" style=\"\">\n    <ul class=\"nav nav-tabs site-nav-tabs\" style=\"\">\n      <li >\n         ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "drive-admin.sections", options) : helperMissing.call(depth0, "link-to", "drive-admin.sections", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n      </li>\n      <li class=\"active\">\n         ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "drive-admin.discettes", options) : helperMissing.call(depth0, "link-to", "drive-admin.discettes", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n      </li>\n\n    </ul>\n  </div>\n\n</div>\n\n\n\n<div class=\"row\">\n\n  <div class=\"col-sm-6\">\n    <h4>Discettes:</h4> \n\n    ");
      stack1 = helpers.each.call(depth0, "discette", "in", "model.discettes", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n  </div>\n\n  <div class=\"col-sm-6\">\n    ");
      stack1 = helpers._triageMustache.call(depth0, "outlet", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  </div>\n\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/drive-admin/discettes/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push("<div class=\"row\">\n  ");
      data.buffer.push(escapeExpression((helper = helpers['discette-form'] || (depth0 && depth0['discette-form']),options={hash:{
        'discette': ("model.newDiscette"),
        'onCreateSuccessAction': ("discetteCreateSuccess")
      },hashTypes:{'discette': "ID",'onCreateSuccessAction': "STRING"},hashContexts:{'discette': depth0,'onCreateSuccessAction': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "discette-form", options))));
      data.buffer.push("\n</div>");
      return buffer;
      
    });
  });
define("discette/templates/drive-admin/discettes/details", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push("<div class=\"row\">\n  ");
      data.buffer.push(escapeExpression((helper = helpers['discette-form'] || (depth0 && depth0['discette-form']),options={hash:{
        'discette': ("model"),
        'onDeleteSuccessAction': ("discetteDeleteSuccess"),
        'openModalAction': ("openModal")
      },hashTypes:{'discette': "ID",'onDeleteSuccessAction': "STRING",'openModalAction': "STRING"},hashContexts:{'discette': depth0,'onDeleteSuccessAction': depth0,'openModalAction': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "discette-form", options))));
      data.buffer.push("\n</div>");
      return buffer;
      
    });
  });
define("discette/templates/drive-admin/sections", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

    function program1(depth0,data) {
      
      
      data.buffer.push(" Manage sections ");
      }

    function program3(depth0,data) {
      
      
      data.buffer.push(" Manage discettes ");
      }

    function program5(depth0,data) {
      
      var buffer = '', stack1, helper, options;
      data.buffer.push(" \n    ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(6, program6, data),contexts:[depth0,depth0],types:["STRING","ID"],data:data},helper ? helper.call(depth0, "drive-admin.sections.details", "section.id", options) : helperMissing.call(depth0, "link-to", "drive-admin.sections.details", "section.id", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" \n    ");
      return buffer;
      }
    function program6(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n    <div class=\"row\">\n      <div class=\"col-sm-2\">\n        <span style=\"font-weight: bold;\">Name:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n      </div>\n      <div class=\"col-sm-2\">\n        <span style=\"font-weight: bold;\">Subdomain:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.subdomain_lower", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n      </div>\n      <div class=\"col-sm-2\">\n        <span style=\"font-weight: bold;\">Discette slug:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.discette_slug", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n      </div>\n      <div class=\"col-sm-2\">\n        <span style=\"font-weight: bold;\">Category slug:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category_slug", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n      </div>\n      <div class=\"col-sm-2\">\n        <span style=\"font-weight: bold;\">Category name:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category_name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>\n      </div>\n\n    </div>\n    ");
      return buffer;
      }

      data.buffer.push("<div class=\"row\" style=\"\">\n  <div class=\"\" style=\"\">\n    <ul class=\"nav nav-tabs site-nav-tabs\" style=\"\">\n      <li class=\"active\">\n        ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "drive-admin.sections", options) : helperMissing.call(depth0, "link-to", "drive-admin.sections", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n      </li>\n      <li>\n        ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "drive-admin.discettes", options) : helperMissing.call(depth0, "link-to", "drive-admin.discettes", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n      </li>\n\n    </ul>\n  </div>\n</div>\n\n<div class=\"row\">\n\n  <div class=\"col-sm-6\">\n    <h4>Sections:</h4> \n    ");
      stack1 = helpers.each.call(depth0, "section", "in", "model.sections", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  </div>\n\n  <div class=\"col-sm-6\">\n    ");
      stack1 = helpers._triageMustache.call(depth0, "outlet", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  </div>\n\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/drive-admin/sections/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push(escapeExpression((helper = helpers['section-form'] || (depth0 && depth0['section-form']),options={hash:{
        'section': ("model.newSection"),
        'onCreateSuccessAction': ("sectionCreateSuccess")
      },hashTypes:{'section': "ID",'onCreateSuccessAction': "STRING"},hashContexts:{'section': depth0,'onCreateSuccessAction': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "section-form", options))));
      data.buffer.push("\n\n<form ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "createNewSection", {hash:{
        'on': ("submit")
      },hashTypes:{'on': "STRING"},hashContexts:{'on': depth0},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n  <div style=\"width: 50%;\" class=\"form-group\">\n    <div>\n      <div style=\"\" class=\"\">\n        <label for='topic-title'>\n          Name:\n        </label>\n      </div>\n    </div>\n    <div class=\"input\">\n      <div style=\"\">\n        ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("controller.newSection.name"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("nameValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n      </div>\n    </div>\n\n    <div class=\"\" style=\"margin-top: 15px;\">\n      <div>\n        <label>\n          Subdomain:\n        </label>\n      </div>\n    </div>\n    <div class=\"input\">\n      <div class=\"\">\n        ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("newSection.subdomain"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push("\n      </div>\n    </div>\n\n    <div class=\"\" style=\"margin-top: 15px;\">\n      <div>\n        <label>\n          Discette:\n        </label>\n      </div>\n    </div>\n    <div class=\"input\">\n      <div class=\"\">\n        ");
      data.buffer.push(escapeExpression(helpers.view.call(depth0, "select", {hash:{
        'content': ("model.discettes"),
        'optionValuePath': ("content.id"),
        'optionLabelPath': ("content.name"),
        'selection': ("newSection.discette")
      },hashTypes:{'content': "ID",'optionValuePath': "STRING",'optionLabelPath': "STRING",'selection': "ID"},hashContexts:{'content': depth0,'optionValuePath': depth0,'optionLabelPath': depth0,'selection': depth0},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push("\n      </div>\n    </div>\n\n    <div class=\"\" style=\"margin-top: 15px;\">\n      <div>\n        <label>\n          Category:\n        </label>\n      </div>\n    </div>\n    <div class=\"input\">\n      <div class=\"\">\n        ");
      data.buffer.push(escapeExpression(helpers.view.call(depth0, "select", {hash:{
        'content': ("model.categories"),
        'optionValuePath': ("content.id"),
        'optionLabelPath': ("content.name"),
        'selection': ("newSection.category")
      },hashTypes:{'content': "ID",'optionValuePath': "STRING",'optionLabelPath': "STRING",'selection': "ID"},hashContexts:{'content': depth0,'optionValuePath': depth0,'optionLabelPath': depth0,'selection': depth0},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push("\n      </div>\n    </div>\n\n    <div class=\"\" style=\"margin-top: 15px;\">\n      <div>\n        <label>\n          Users:\n        </label>\n      </div>\n    </div>\n\n    <div class=\"tip bad\">");
      stack1 = helpers._triageMustache.call(depth0, "serverError", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</div>\n\n  </div>\n\n  <div class=\"form-buttons\">\n    <button class='btn' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancelNewSection", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" style=\"\">\n      Cancel\n    </button>\n    <button class='btn btn-primary' type=\"submit\" title=\"\">\n      Save\n    </button>\n  </div>\n</form>\n");
      return buffer;
      
    });
  });
define("discette/templates/drive-admin/sections/details", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push("\n");
      data.buffer.push(escapeExpression((helper = helpers['section-form'] || (depth0 && depth0['section-form']),options={hash:{
        'section': ("section"),
        'currentSection': ("section")
      },hashTypes:{'section': "ID",'currentSection': "ID"},hashContexts:{'section': depth0,'currentSection': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "section-form", options))));
      data.buffer.push("\n\n");
      return buffer;
      
    });
  });
define("discette/templates/home", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1;


      data.buffer.push("\n");
      stack1 = helpers._triageMustache.call(depth0, "outlet", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n");
      return buffer;
      
    });
  });
define("discette/templates/home/about", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

    function program1(depth0,data) {
      
      
      data.buffer.push(" Conversations ");
      }

    function program3(depth0,data) {
      
      
      data.buffer.push(" About ");
      }

    function program5(depth0,data) {
      
      var buffer = '', helper, options;
      data.buffer.push("\n  <div class=\"row\">\n    <div class='col-sm-12'>\n      ");
      data.buffer.push(escapeExpression((helper = helpers['content-composer'] || (depth0 && depth0['content-composer']),options={hash:{
        'minContentLength': (2),
        'serverError': ("controller.primaryPostServerError"),
        'height': (200),
        'btnSize': ("bs-sm"),
        'content': ("controller.primaryPostWithRaw.raw"),
        'focus': (true),
        'save': ("updatePrimaryPost"),
        'cancel': ("cancelPrimaryPostEdit")
      },hashTypes:{'minContentLength': "INTEGER",'serverError': "ID",'height': "INTEGER",'btnSize': "ID",'content': "ID",'focus': "BOOLEAN",'save': "STRING",'cancel': "STRING"},hashContexts:{'minContentLength': depth0,'serverError': depth0,'height': depth0,'btnSize': depth0,'content': depth0,'focus': depth0,'save': depth0,'cancel': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "content-composer", options))));
      data.buffer.push("\n    </div>\n  </div>\n\n  ");
      return buffer;
      }

    function program7(depth0,data) {
      
      var buffer = '', stack1, helper, options;
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['section-overview'] || (depth0 && depth0['section-overview']),options={hash:{
        'section': ("model.section"),
        'currentSection': ("controller.settingsService.currentSection"),
        'summaryView': (true)
      },hashTypes:{'section': "ID",'currentSection': "ID",'summaryView': "BOOLEAN"},hashContexts:{'section': depth0,'currentSection': depth0,'summaryView': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "section-overview", options))));
      data.buffer.push("\n  <div class=\"row\">\n    <div class='col-md-11'>\n      ");
      stack1 = helpers['if'].call(depth0, "controller.primaryPost.can_edit", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(8, program8, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n    </div>\n    <section class=\"topic-area\">\n      <div class='body-page'>\n\n        <div class='col-md-10 col-sm-10 col-xs-12'>\n          <div class='bottom-round contents regular'>\n            <div class=\"cooked\">\n              ");
      data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "controller.primaryPost.cooked", {hash:{
        'unescaped': ("true")
      },hashTypes:{'unescaped': "STRING"},hashContexts:{'unescaped': depth0},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push("\n            </div>\n          </div>\n        </div>\n      </div>\n    </section>\n  </div>\n  ");
      return buffer;
      }
    function program8(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n      <span class='btn pull-right' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startEditingPrimaryPost", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n        <i class=\"fa fa-pencil\"></i>Edit\n      </span> \n      ");
      return buffer;
      }

    function program10(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n    <div class='col-md-12'>\n      <h4>Comments:</h4>\n    </div>\n    <section class=\"topic-area\" id='topic' data-topic-id='");
      data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "id", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push("'>\n      <div class='posts-wrapper'>\n\n        ");
      stack1 = helpers.each.call(depth0, "item", "in", "controller.comments", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(11, program11, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n      </div>\n    </section>\n    ");
      return buffer;
      }
    function program11(depth0,data) {
      
      var buffer = '', helper, options;
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['post-details'] || (depth0 && depth0['post-details']),options={hash:{
        'openModalAction': ("openModal"),
        'postModel': ("item")
      },hashTypes:{'openModalAction': "STRING",'postModel': "ID"},hashContexts:{'openModalAction': depth0,'postModel': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "post-details", options))));
      data.buffer.push(" ");
      return buffer;
      }

    function program13(depth0,data) {
      
      var buffer = '', helper, options;
      data.buffer.push("\n\n    <div class=\"row\">\n      <div class='col-sm-12'>\n        ");
      data.buffer.push(escapeExpression((helper = helpers['content-composer'] || (depth0 && depth0['content-composer']),options={hash:{
        'minContentLength': (20),
        'serverError': ("controller.commentServerError"),
        'height': (200),
        'btnSize': ("bs-sm"),
        'content': ("model.draft"),
        'focus': (true),
        'save': ("processSectionComment"),
        'cancel': ("cancelReplyToTopic")
      },hashTypes:{'minContentLength': "INTEGER",'serverError': "ID",'height': "INTEGER",'btnSize': "ID",'content': "ID",'focus': "BOOLEAN",'save': "STRING",'cancel': "STRING"},hashContexts:{'minContentLength': depth0,'serverError': depth0,'height': depth0,'btnSize': depth0,'content': depth0,'focus': depth0,'save': depth0,'cancel': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "content-composer", options))));
      data.buffer.push("\n      </div>\n    </div>\n\n\n    ");
      return buffer;
      }

    function program15(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n    <div class=\"row reply-btn-row\">\n      <div class='col-md-11'>\n        <button class='btn btn-primary pull-right' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startCommentOnSection", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n          <i class=\"fa fa-reply\"></i>Comment\n        </button>\n      </div>\n    </div>\n    ");
      return buffer;
      }

      data.buffer.push("<div class=\"about-container\">\n\n  <div class=\"row\" style=\"\">\n    <div class=\"\" style=\"\">\n      <ul class=\"nav nav-tabs site-nav-tabs\" style=\"\">\n        <li>\n          ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "home", options) : helperMissing.call(depth0, "link-to", "home", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n        </li>\n        <li class=\"active\">\n          ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "home.about", options) : helperMissing.call(depth0, "link-to", "home.about", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n        </li>\n      </ul>\n    </div>\n  </div>\n\n\n  ");
      stack1 = helpers['if'].call(depth0, "controller.isEditingPrimaryPost", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n\n\n  <div class=\"row\">\n    ");
      stack1 = helpers['if'].call(depth0, "controller.comments", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(10, program10, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  </div>\n\n\n  <div class=\"\">\n\n\n    ");
      stack1 = helpers['if'].call(depth0, "controller.isCommenting", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(15, program15, data),fn:self.program(13, program13, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  </div>\n\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/home/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

    function program1(depth0,data) {
      
      
      data.buffer.push(" Conversations ");
      }

    function program3(depth0,data) {
      
      
      data.buffer.push(" About ");
      }

    function program5(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n    <div class=\"col-md-11 col-sm-12 well\">\n    <h4>\n            There are no conversations yet in this micro-forum. \n    </h4>\n            <span ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startNewTopic", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" class=\"btn\">Get the ball rolling by <a> starting a new conversation</a> </span class=\"btn\">\n\n    </div>\n    ");
      return buffer;
      }

    function program7(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n    <div class=\"col-md-11 col-sm-12\">\n      ");
      stack1 = helpers.each.call(depth0, "topic", "in", "model", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(8, program8, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n    </div>\n    ");
      return buffer;
      }
    function program8(depth0,data) {
      
      var buffer = '', stack1, helper, options;
      data.buffer.push("\n      <div class=\"section-topic-line\">\n        ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(9, program9, data),contexts:[depth0,depth0,depth0],types:["STRING","ID","ID"],data:data},helper ? helper.call(depth0, "topic", "topic.id", "topic.slug", options) : helperMissing.call(depth0, "link-to", "topic", "topic.id", "topic.slug", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n      </div>\n      ");
      return buffer;
      }
    function program9(depth0,data) {
      
      var buffer = '', stack1, helper, options;
      data.buffer.push("\n        <div class=\"section-topic-row\">\n          <h3 class=\"topic-list-title\">\n            ");
      stack1 = helpers._triageMustache.call(depth0, "topic.title", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n          <small class=\"pull-right\">\n            <span class=\"badge-posts\">");
      stack1 = helpers._triageMustache.call(depth0, "topic.views", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("  <i class=\"fa fa-eye\"></i></span>\n            <span class=\"badge-posts\">");
      stack1 = helpers._triageMustache.call(depth0, "topic.posts_count", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" <i class=\"fa fa-comments\"></i></span>\n            <span class=\"badge-posts\">last post: ");
      data.buffer.push(escapeExpression((helper = helpers.ago || (depth0 && depth0.ago),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data},helper ? helper.call(depth0, "topic.last_posted_at", options) : helperMissing.call(depth0, "ago", "topic.last_posted_at", options))));
      data.buffer.push("</span>\n          </small>\n          </h3>\n          <p class=\"topic-excerpt \">");
      data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "topic.excerpt", {hash:{
        'unescaped': ("true")
      },hashTypes:{'unescaped': "STRING"},hashContexts:{'unescaped': depth0},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push("</p>\n\n        </div>\n        ");
      return buffer;
      }

      data.buffer.push("<div class=\"conversations-container\">\n  <div class=\"row\" style=\"\">\n    <div class=\"\" style=\"\">\n      <ul class=\"nav nav-tabs site-nav-tabs\" style=\"\">\n        <li class=\"active\">\n          ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "home", options) : helperMissing.call(depth0, "link-to", "home", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n        </li>\n        <li>\n          ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "home.about", options) : helperMissing.call(depth0, "link-to", "home.about", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n        </li>\n      </ul>\n    </div>\n  </div>\n\n\n  <div class=\"row\">\n    <div class=\"col-md-11 col-sm-12\">\n      <span class='btn pull-right' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startNewTopic", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n        <i class=\"fa fa-plus\"></i>New Conversation\n      </span>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    ");
      stack1 = helpers['if'].call(depth0, "noTopics", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  </div>\n\n\n\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/home/manage", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


      data.buffer.push("<div class=\"row\">\n</div>\n<div class=\"home-title-row row\">\n  <h2 id=\"title\">Manage this mini-forum</h2>\n\n</div>\n\n");
      data.buffer.push(escapeExpression((helper = helpers['section-overview'] || (depth0 && depth0['section-overview']),options={hash:{
        'section': ("section"),
        'currentSection': ("controller.settingsService.currentSection")
      },hashTypes:{'section': "ID",'currentSection': "ID"},hashContexts:{'section': depth0,'currentSection': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "section-overview", options))));
      data.buffer.push("\n\n</br>\n\n<h3>Category:</h3>\n<div class=\"row\">\n  <div class=\"col-sm-2\">\n    <span style=\"font-weight: bold;\">Name:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category.name", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span>     \n  </div>\n  <div class=\"col-sm-2\">\n    <span style=\"font-weight: bold;\">Read restricted:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category.read_restricted", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span> \n  </div>\n  <div class=\"col-sm-2\">\n    <span style=\"font-weight: bold;\">Can edit:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category.can_edit", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span> \n  </div>\n  <div class=\"col-sm-2\">\n    <span style=\"font-weight: bold;\">Topic count:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category.topic_count", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span> \n  </div>\n  <div class=\"col-sm-2\">\n    <span style=\"font-weight: bold;\">Post count:</span> <span>");
      stack1 = helpers._triageMustache.call(depth0, "section.category.post_count", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</span> \n  </div>\n\n  <div class=\"col-sm-2\">\n  </div>\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/modal/confirm-action", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, escapeExpression=this.escapeExpression;


      data.buffer.push("<div class=\"modal-dialog modal-sm\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button class=\"close\" type=\"button\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancel", {hash:{
        'on': ("click")
      },hashTypes:{'on': "STRING"},hashContexts:{'on': depth0},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push(">x</button>\n      <h4 class=\"modal-title\">Please confirm</h4>\n    </div>\n    <div id='modal-alert'></div>\n\n    <div class=\"modal-body\">\n    <div class=\"row\">\n      <div class='col-sm-12'>\n      ");
      stack1 = helpers._triageMustache.call(depth0, "model.displayText", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n      </div>\n    </div>\n    </div>\n\n    <div class=\"modal-footer\">\n      <button class='btn' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "closeModal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" style=\"\">\n        Cancel\n      </button>\n      <button class='btn btn-primary' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "confirmedAction", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n        Yes\n      </button>\n    </div>\n\n\n\n\n  </div>\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/modal/edit-post", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


      data.buffer.push("<div class=\"modal-dialog modal-lg\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button class=\"close\" type=\"button\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancel", {hash:{
        'on': ("click")
      },hashTypes:{'on': "STRING"},hashContexts:{'on': depth0},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push(">x</button>\n      <h4 class=\"modal-title\">Edit post</h4>\n    </div>\n    <div id='modal-alert'></div>\n\n    <div class=\"modal-body\">\n    <div class=\"row\">\n      <div class='col-sm-12'>\n        ");
      data.buffer.push(escapeExpression((helper = helpers['content-composer'] || (depth0 && depth0['content-composer']),options={hash:{
        'minContentLength': (15),
        'serverError': ("controller.commentServerError"),
        'height': (200),
        'btnSize': ("bs-sm"),
        'content': ("model.raw"),
        'focus': (true),
        'save': ("updatePost"),
        'cancel': ("closeModal")
      },hashTypes:{'minContentLength': "INTEGER",'serverError': "ID",'height': "INTEGER",'btnSize': "ID",'content': "ID",'focus': "BOOLEAN",'save': "STRING",'cancel': "STRING"},hashContexts:{'minContentLength': depth0,'serverError': depth0,'height': depth0,'btnSize': depth0,'content': depth0,'focus': depth0,'save': depth0,'cancel': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "content-composer", options))));
      data.buffer.push("\n      </div>\n    </div>\n    </div>\n\n    <div class=\"modal-footer\">\n      <button class='btn' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "closeModal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" style=\"\">\n        Cancel\n      </button>\n      <button class='btn btn-primary' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "updatePost", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n        Save\n      </button>\n    </div>\n\n\n\n\n  </div>\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/modal/log-in", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

    function program1(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n        <div class=\"col-md-6 col-sm-12\" >\n          <button ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'class': (":btn :btn-social b.name")
      },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "externalLogin", "b", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0,depth0],types:["STRING","ID"],data:data})));
      data.buffer.push("><i  ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'class': (":fa b.faClass")
      },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(" ></i>");
      stack1 = helpers._triageMustache.call(depth0, "b.title", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</button>\n        </div>\n      ");
      return buffer;
      }

    function program3(depth0,data) {
      
      
      data.buffer.push("\n    &nbsp; 'login.authenticating'\n  ");
      }

      data.buffer.push("<div class=\"modal-dialog modal-sm\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button class=\"close\" type=\"button\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancel", {hash:{
        'on': ("click")
      },hashTypes:{'on': "STRING"},hashContexts:{'on': depth0},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push(">x</button>\n      <h4 class=\"modal-title\">Log In</h4>\n    </div>\n\n\n<div id='modal-alert'></div>\n<div class=\"modal-body\">\n\n    <div class=\"row\">\n      ");
      stack1 = helpers.each.call(depth0, "b", "in", "controller.loginButtons", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n    </div>\n\n    <form id='login-form' method='post'>\n      <div class=\"form-group\" style=\"margin-bottom: 0px;\">\n        <div>\n          <div>\n            <div>\n              <label for='login-account-name'>Username&nbsp;</label>\n            </div>\n            <div>\n              ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'value': ("loginName"),
        'placeholderKey': ("login.email_placeholder"),
        'id': ("login-account-name"),
        'class': ("form-control"),
        'autocorrect': ("off"),
        'autocapitalize': ("off"),
        'autofocus': ("autofocus")
      },hashTypes:{'value': "ID",'placeholderKey': "STRING",'id': "STRING",'class': "STRING",'autocorrect': "STRING",'autocapitalize': "STRING",'autofocus': "STRING"},hashContexts:{'value': depth0,'placeholderKey': depth0,'id': depth0,'class': depth0,'autocorrect': depth0,'autocapitalize': depth0,'autofocus': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push("\n            </div>\n            <div></div>\n          </div>\n          <div>\n            <div>\n                <label for='login-account-password'>Password&nbsp;</label>\n            </div>\n            <div>\n                ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'value': ("loginPassword"),
        'type': ("password"),
        'id': ("login-account-password"),
        'maxlength': ("200"),
        'capsLockOn': ("capsLockOn"),
        'class': ("form-control")
      },hashTypes:{'value': "ID",'type': "STRING",'id': "STRING",'maxlength': "STRING",'capsLockOn': "ID",'class': "STRING"},hashContexts:{'value': depth0,'type': depth0,'id': depth0,'maxlength': depth0,'capsLockOn': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push(" &nbsp;\n            </div>\n            <div>\n              <a id=\"forgot-password-link\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "showForgotPassword", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push("></a>\n            </div>\n          </div>\n          <div style=\"display:none\">\n          </div>\n        </div>\n      </div>\n    </form>\n  ");
      stack1 = helpers._triageMustache.call(depth0, "authMessage", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  <div id='login-alert' ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'class': ("alertClass")
      },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
      data.buffer.push(">");
      stack1 = helpers._triageMustache.call(depth0, "alert", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("</div>\n</div>\n\n<div class=\"modal-footer\">\n    <button class='btn' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "closeModal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" style=\"\">\n        Cancel\n      </button>\n    <button class=\"btn btn-large btn-primary\"\n      ");
      data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
        'disabled': ("loginDisabled")
      },hashTypes:{'disabled': "STRING"},hashContexts:{'disabled': depth0},contexts:[],types:[],data:data})));
      data.buffer.push("\n      ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "login", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n        <i class=\"fa fa-unlock\"></i>&nbsp;Log In\n    </button>\n\n  ");
      stack1 = helpers['if'].call(depth0, "authenticate", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n</div>\n\n\n  </div>\n</div>");
      return buffer;
      
    });
  });
define("discette/templates/modal/new-topic", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


      data.buffer.push("<div class=\"modal-dialog modal-lg\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button class=\"close\" type=\"button\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancel", {hash:{
        'on': ("click")
      },hashTypes:{'on': "STRING"},hashContexts:{'on': depth0},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push(">x</button>\n      <h4 class=\"modal-title\">New Conversation</h4>\n    </div>\n    <div id='modal-alert'></div>\n\n    <div class=\"modal-body\">\n      <div>\n          <form ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "createNewTopic", {hash:{
        'on': ("submit")
      },hashTypes:{'on': "STRING"},hashContexts:{'on': depth0},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n            <div style=\"width: 100%;\" class=\"form-group\" >\n              <div>\n                <div style=\"\" class=\"\">\n                  <label for='topic-title'>\n                    Title:\n                  </label>\n                </div>\n              </div>\n              <div class=\"input\">\n                <div style=\"\">\n                  ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("topicTitle"),
        'id': ("topic-title"),
        'autofocus': ("autofocus"),
        'class': ("form-control"),
        'tabindex': ("0")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'id': "STRING",'autofocus': "STRING",'class': "STRING",'tabindex': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'id': depth0,'autofocus': depth0,'class': depth0,'tabindex': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push(" \n                  ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("titleValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n                </div>\n              </div>\n\n              <div class=\"\" style=\"margin-top: 15px;\">\n                <div>\n                  <label>\n                    First Post:\n                  </label>\n                </div>\n              </div>\n              <div>\n                <div class=\"\">\n                  ");
      data.buffer.push(escapeExpression((helper = helpers['pagedown-bootstrap'] || (depth0 && depth0['pagedown-bootstrap']),options={hash:{
        'height': (200),
        'btnSize': ("bs-sm"),
        'content': ("firstPost"),
        'focus': (true)
      },hashTypes:{'height': "INTEGER",'btnSize': "ID",'content': "ID",'focus': "BOOLEAN"},hashContexts:{'height': depth0,'btnSize': depth0,'content': depth0,'focus': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "pagedown-bootstrap", options))));
      data.buffer.push("\n                  ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("firstPostValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n                </div>\n              </div>\n            </div>\n          </form>\n      </div>\n    </div>\n\n    <div class=\"modal-footer\">\n      <button class='btn' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "closeModal", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" style=\"\">\n        Cancel\n      </button>\n      <button class='btn btn-primary' ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "createNewTopic", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n        Save\n      </button>\n    </div>\n\n\n\n\n  </div>\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/overview/default", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

    function program1(depth0,data) {
      
      var buffer = '', helper, options;
      data.buffer.push("\n  ");
      data.buffer.push(escapeExpression((helper = helpers['section-overview'] || (depth0 && depth0['section-overview']),options={hash:{
        'section': ("section"),
        'currentSection': ("controller.settingsService.currentSection")
      },hashTypes:{'section': "ID",'currentSection': "ID"},hashContexts:{'section': depth0,'currentSection': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "section-overview", options))));
      data.buffer.push("\n");
      return buffer;
      }

      data.buffer.push("<div class=\"home-title-row row\">\n  <h2 id=\"title\">Overview of sections</h2>\n</div>\n\n<div class=\"row\">\n\n\n");
      stack1 = helpers.each.call(depth0, "section", "in", "model.sections", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/start", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

    function program1(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n\n<section>\n  <div class=\"row\">\n    <div class=\"col-md-8  col-md-offset-2\">\n      <div class=\"well\" style=\"\">\n        <h1 style=\"color: #090;font-size: 4em;text-align: center;\">\n              ");
      stack1 = helpers._triageMustache.call(depth0, "model.subdomain_lower", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" <small style=\"font-size:0.5em\"> is available!</small> </h1>\n\n        ");
      stack1 = helpers['if'].call(depth0, "controller.settingsService.currentUser", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n      </div>\n    </div>\n  </div>\n</section>\n\n\n");
      return buffer;
      }
    function program2(depth0,data) {
      
      var buffer = '', helper, options;
      data.buffer.push("\n        <h5 style=\"text-align: center;\">You can host your micro-forum here by filling the form below.</h5>\n        <div class=\"row\">\n          <form ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "claimNewSection", {hash:{
        'on': ("submit")
      },hashTypes:{'on': "STRING"},hashContexts:{'on': depth0},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n            <div style=\"margin: 1%;\" class=\"form-group\">\n              <div>\n                <div style=\"\" class=\"\">\n                  <label for='topic-title'>\n                    Display name:\n                  </label>\n                </div>\n              </div>\n              <div class=\"input\">\n                <div style=\"width: 50%;\">\n                  ");
      data.buffer.push(escapeExpression((helper = helpers.input || (depth0 && depth0.input),options={hash:{
        'placeholder': (""),
        'value': ("controller.newSection.name"),
        'autofocus': ("autofocus"),
        'class': ("form-control")
      },hashTypes:{'placeholder': "STRING",'value': "ID",'autofocus': "STRING",'class': "STRING"},hashContexts:{'placeholder': depth0,'value': depth0,'autofocus': depth0,'class': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input", options))));
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("nameValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n                </div>\n              </div>\n\n              <div class=\"\" style=\"margin-top: 15px;\">\n                <div>\n                  <label>\n                    Brief description:\n                  </label>\n                </div>\n              </div>\n              <div class=\"input\">\n                <div class=\"\">\n                  ");
      data.buffer.push(escapeExpression((helper = helpers.textarea || (depth0 && depth0.textarea),options={hash:{
        'value': ("controller.newSection.description"),
        'class': ("form-control"),
        'autofocus': ("autofocus")
      },hashTypes:{'value': "ID",'class': "STRING",'autofocus': "STRING"},hashContexts:{'value': depth0,'class': depth0,'autofocus': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "textarea", options))));
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("descriptionValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['input-tip'] || (depth0 && depth0['input-tip']),options={hash:{
        'validation': ("serverErrorValidation")
      },hashTypes:{'validation': "ID"},hashContexts:{'validation': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "input-tip", options))));
      data.buffer.push("\n                </div>\n              </div>\n\n              <div class=\"form-buttons\"  style=\"text-align: center;\">\n                <button class='btn btn-primary' style=\"margin-top:20px;padding:15px;min-width: 300px;font-size:20px\" type=\"submit\">\n                  <i class=\"fa fa-plus\"></i>Claim this micro-forum\n                </button>\n              </div>\n            </div>\n          </form>\n        </div>\n      ");
      return buffer;
      }

    function program4(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n        <div class=\"form-buttons\" style=\"text-align: center;\">\n          <button class='btn btn-primary' style=\"margin-top:20px;padding:15px;min-width: 300px;font-size:20px\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "showLogIn", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(">\n            <i class=\"fa\"></i>Log-in to claim this micro-forum\n          </button>\n        </div>\n      ");
      return buffer;
      }

    function program6(depth0,data) {
      
      var buffer = '', stack1;
      data.buffer.push("\n<section>\n  <div class=\"row\">\n    <div class=\"col-md-8  col-md-offset-2\">\n      <div class=\"well\" style=\"margin-bottom:550px;height:200px\">\n        <h1 style=\"color: #090;font-size: 4em;text-align: center;\">\n              ");
      stack1 = helpers._triageMustache.call(depth0, "model.subdomain_lower", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push(" <small style=\"font-size:0.5em\"> is not available</small> </h1>\n      </div>\n    </div>\n  </div>\n</section>\n");
      return buffer;
      }

      stack1 = helpers['if'].call(depth0, "controller.isAvailable", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(6, program6, data),fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n");
      return buffer;
      
    });
  });
define("discette/templates/topic", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

    function program1(depth0,data) {
      
      
      data.buffer.push(" Conversations ");
      }

    function program3(depth0,data) {
      
      
      data.buffer.push(" About ");
      }

    function program5(depth0,data) {
      
      var buffer = '', helper, options;
      data.buffer.push(" ");
      data.buffer.push(escapeExpression((helper = helpers['post-details'] || (depth0 && depth0['post-details']),options={hash:{
        'openModalAction': ("openModal"),
        'postModel': ("postModel")
      },hashTypes:{'openModalAction': "STRING",'postModel': "ID"},hashContexts:{'openModalAction': depth0,'postModel': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "post-details", options))));
      data.buffer.push(" ");
      return buffer;
      }

    function program7(depth0,data) {
      
      var buffer = '', helper, options;
      data.buffer.push("\n      <div class=\"row reply-row\">\n        <div style=\"margin-bottom: 2%;\" class='col-sm-12'>\n          <h4>Your Reply:</h4>\n        </div>\n        <div class='col-md-10 col-sm-12'>\n          <div class=\"pagedown-container bottom-round\">\n            ");
      data.buffer.push(escapeExpression((helper = helpers['pagedown-bootstrap'] || (depth0 && depth0['pagedown-bootstrap']),options={hash:{
        'height': (200),
        'btnSize': ("bs-sm"),
        'content': ("model.draft"),
        'focus': (true)
      },hashTypes:{'height': "INTEGER",'btnSize': "ID",'content': "ID",'focus': "BOOLEAN"},hashContexts:{'height': depth0,'btnSize': depth0,'content': depth0,'focus': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "pagedown-bootstrap", options))));
      data.buffer.push("\n          </div>\n        </div>\n        <div class='col-md-2 col-sm-12'>\n          <div style=\"margin-top:3%\">\n            <button class='btn btn-primary' style=\"width: 100%;margin-bottom:10px;\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "processReplyToTopic", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n              Save\n            </button>\n            <button class='btn' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "cancelReplyToTopic", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n              Cancel\n            </button>\n          </div>\n        </div>\n      </div>\n      <div class=\"row\">\n      </div>\n      ");
      return buffer;
      }

    function program9(depth0,data) {
      
      var buffer = '';
      data.buffer.push("\n      <div class=\"row reply-btn-row\">\n        <div class='col-md-11'>\n          <button class='btn btn-primary pull-right' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startReplyToTopic", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n            <i class=\"fa fa-reply\"></i>Reply\n          </button>\n        </div>\n      </div>\n      ");
      return buffer;
      }

      data.buffer.push("<div class=\"topic-container\">\n\n  <div class=\"row\" style=\"\">\n    <div class=\"\" style=\"\">\n      <ul class=\"nav nav-tabs site-nav-tabs\" style=\"\">\n        <li class=\"active\">\n          ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "home", options) : helperMissing.call(depth0, "link-to", "home", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n        </li>\n        <li>\n          ");
      stack1 = (helper = helpers['link-to'] || (depth0 && depth0['link-to']),options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(3, program3, data),contexts:[depth0],types:["STRING"],data:data},helper ? helper.call(depth0, "home.about", options) : helperMissing.call(depth0, "link-to", "home.about", options));
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n        </li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-11 col-sm-12\">\n      <span class='btn pull-right' style=\"\" ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "startNewTopic", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" title=\"\">\n        <i class=\"fa fa-plus\"></i>New Conversation\n      </span>\n    </div>\n  </div>\n\n\n  <div class=\"topic-details\">\n\n    <h1 class=\"topic-title\">");
      stack1 = helpers._triageMustache.call(depth0, "model.title", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n  </h1>\n\n    <div class=\"posts\">\n\n      <div class=\"row\">\n        <section class=\"topic-area\" id='topic' data-topic-id='");
      data.buffer.push(escapeExpression(helpers.unbound.call(depth0, "id", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data})));
      data.buffer.push("'>\n          <div class='posts-wrapper'>\n\n            ");
      stack1 = helpers.each.call(depth0, "postModel", "in", "controller.postModels", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(5, program5, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n\n          </div>\n        </section>\n      </div>\n    </div>\n\n    <div class=\"\">\n\n\n      ");
      stack1 = helpers['if'].call(depth0, "controller.isEditing", {hash:{},hashTypes:{},hashContexts:{},inverse:self.program(9, program9, data),fn:self.program(7, program7, data),contexts:[depth0],types:["ID"],data:data});
      if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
      data.buffer.push("\n    </div>\n\n\n  </div>\n\n</div>\n");
      return buffer;
      
    });
  });
define("discette/templates/user-dropdown", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
      var buffer = '', escapeExpression=this.escapeExpression;


      data.buffer.push("<section class='d-dropdown' id='user-dropdown'>\n  <ul class='user-dropdown-links'>\n    <li><button ");
      data.buffer.push(escapeExpression(helpers.action.call(depth0, "logout", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
      data.buffer.push(" class='btn btn-danger right logout'><i class='fa fa-sign-out'></i>Log Out</button></li>\n  </ul>\n</section>\n");
      return buffer;
      
    });
  });
define("discette/tests/app.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - .');
    test('app.js should pass jshint', function() { 
      ok(true, 'app.js should pass jshint.'); 
    });
  });
define("discette/tests/components/content-composer.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/content-composer.js should pass jshint', function() { 
      ok(true, 'components/content-composer.js should pass jshint.'); 
    });
  });
define("discette/tests/components/discette-form.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/discette-form.js should pass jshint', function() { 
      ok(true, 'components/discette-form.js should pass jshint.'); 
    });
  });
define("discette/tests/components/discette-header.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/discette-header.js should pass jshint', function() { 
      ok(true, 'components/discette-header.js should pass jshint.'); 
    });
  });
define("discette/tests/components/input-tip.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/input-tip.js should pass jshint', function() { 
      ok(true, 'components/input-tip.js should pass jshint.'); 
    });
  });
define("discette/tests/components/pagedown-bootstrap.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/pagedown-bootstrap.js should pass jshint', function() { 
      ok(true, 'components/pagedown-bootstrap.js should pass jshint.'); 
    });
  });
define("discette/tests/components/post-details.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/post-details.js should pass jshint', function() { 
      ok(true, 'components/post-details.js should pass jshint.'); 
    });
  });
define("discette/tests/components/section-form.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/section-form.js should pass jshint', function() { 
      ok(true, 'components/section-form.js should pass jshint.'); 
    });
  });
define("discette/tests/components/section-overview.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - components');
    test('components/section-overview.js should pass jshint', function() { 
      ok(true, 'components/section-overview.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/application.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers');
    test('controllers/application.js should pass jshint', function() { 
      ok(true, 'controllers/application.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/drive-admin/sections/default.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers/drive-admin/sections');
    test('controllers/drive-admin/sections/default.js should pass jshint', function() { 
      ok(true, 'controllers/drive-admin/sections/default.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/home/about.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers/home');
    test('controllers/home/about.js should pass jshint', function() { 
      ok(true, 'controllers/home/about.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/modal.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers');
    test('controllers/modal.js should pass jshint', function() { 
      ok(true, 'controllers/modal.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/modal/confirm-action.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers/modal');
    test('controllers/modal/confirm-action.js should pass jshint', function() { 
      ok(true, 'controllers/modal/confirm-action.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/modal/edit-post.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers/modal');
    test('controllers/modal/edit-post.js should pass jshint', function() { 
      ok(true, 'controllers/modal/edit-post.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/modal/log-in.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers/modal');
    test('controllers/modal/log-in.js should pass jshint', function() { 
      ok(true, 'controllers/modal/log-in.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/modal/new-topic.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers/modal');
    test('controllers/modal/new-topic.js should pass jshint', function() { 
      ok(true, 'controllers/modal/new-topic.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/start.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers');
    test('controllers/start.js should pass jshint', function() { 
      ok(true, 'controllers/start.js should pass jshint.'); 
    });
  });
define("discette/tests/controllers/topic.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - controllers');
    test('controllers/topic.js should pass jshint', function() { 
      ok(true, 'controllers/topic.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/helpers/resolver.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/helpers');
    test('discette/tests/helpers/resolver.js should pass jshint', function() { 
      ok(true, 'discette/tests/helpers/resolver.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/helpers/start-app.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/helpers');
    test('discette/tests/helpers/start-app.js should pass jshint', function() { 
      ok(true, 'discette/tests/helpers/start-app.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/test-helper.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests');
    test('discette/tests/test-helper.js should pass jshint', function() { 
      ok(true, 'discette/tests/test-helper.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/components/discette-header-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/components');
    test('discette/tests/unit/components/discette-header-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/components/discette-header-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/components/pagedown-bootstrap-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/components');
    test('discette/tests/unit/components/pagedown-bootstrap-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/components/pagedown-bootstrap-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/components/post-details-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/components');
    test('discette/tests/unit/components/post-details-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/components/post-details-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/controllers/application-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/controllers');
    test('discette/tests/unit/controllers/application-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/controllers/application-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/controllers/modal-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/controllers');
    test('discette/tests/unit/controllers/modal-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/controllers/modal-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/controllers/modal/log-in-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/controllers/modal');
    test('discette/tests/unit/controllers/modal/log-in-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/controllers/modal/log-in-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/controllers/modal/new-topic-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/controllers/modal');
    test('discette/tests/unit/controllers/modal/new-topic-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/controllers/modal/new-topic-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/models/topic-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/models');
    test('discette/tests/unit/models/topic-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/models/topic-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/routes/application-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/routes');
    test('discette/tests/unit/routes/application-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/routes/application-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/routes/home-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/routes');
    test('discette/tests/unit/routes/home-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/routes/home-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/routes/topic-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/routes');
    test('discette/tests/unit/routes/topic-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/routes/topic-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/services/settings-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/services');
    test('discette/tests/unit/services/settings-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/services/settings-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/views/home/manage-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/views/home');
    test('discette/tests/unit/views/home/manage-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/views/home/manage-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/views/modal-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/views');
    test('discette/tests/unit/views/modal-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/views/modal-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/views/modal/log-in-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/views/modal');
    test('discette/tests/unit/views/modal/log-in-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/views/modal/log-in-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/views/modal/new-topic-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/views/modal');
    test('discette/tests/unit/views/modal/new-topic-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/views/modal/new-topic-test.js should pass jshint.'); 
    });
  });
define("discette/tests/discette/tests/unit/views/user-dropdown-test.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - discette/tests/unit/views');
    test('discette/tests/unit/views/user-dropdown-test.js should pass jshint', function() { 
      ok(true, 'discette/tests/unit/views/user-dropdown-test.js should pass jshint.'); 
    });
  });
define("discette/tests/helpers/resolver", 
  ["ember/resolver","discette/config/environment","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Resolver = __dependency1__["default"];
    var config = __dependency2__["default"];

    var resolver = Resolver.create();

    resolver.namespace = {
      modulePrefix: config.modulePrefix,
      podModulePrefix: config.podModulePrefix
    };

    __exports__["default"] = resolver;
  });
define("discette/tests/helpers/start-app", 
  ["ember","discette/app","discette/router","discette/config/environment","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Application = __dependency2__["default"];
    var Router = __dependency3__["default"];
    var config = __dependency4__["default"];

    __exports__["default"] = function startApp(attrs) {
      var application;

      var attributes = Ember.merge({}, config.APP);
      attributes = Ember.merge(attributes, attrs); // use defaults, but you can override;

      Ember.run(function() {
        application = Application.create(attributes);
        application.setupForTesting();
        application.injectTestHelpers();
      });

      return application;
    }
  });
define("discette/tests/initializers/api-service.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - initializers');
    test('initializers/api-service.js should pass jshint', function() { 
      ok(true, 'initializers/api-service.js should pass jshint.'); 
    });
  });
define("discette/tests/initializers/settings-service.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - initializers');
    test('initializers/settings-service.js should pass jshint', function() { 
      ok(true, 'initializers/settings-service.js should pass jshint.'); 
    });
  });
define("discette/tests/models/discette.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - models');
    test('models/discette.js should pass jshint', function() { 
      ok(true, 'models/discette.js should pass jshint.'); 
    });
  });
define("discette/tests/models/post.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - models');
    test('models/post.js should pass jshint', function() { 
      ok(true, 'models/post.js should pass jshint.'); 
    });
  });
define("discette/tests/models/section.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - models');
    test('models/section.js should pass jshint', function() { 
      ok(true, 'models/section.js should pass jshint.'); 
    });
  });
define("discette/tests/models/topic.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - models');
    test('models/topic.js should pass jshint', function() { 
      ok(true, 'models/topic.js should pass jshint.'); 
    });
  });
define("discette/tests/models/user.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - models');
    test('models/user.js should pass jshint', function() { 
      ok(true, 'models/user.js should pass jshint.'); 
    });
  });
define("discette/tests/router.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - .');
    test('router.js should pass jshint', function() { 
      ok(true, 'router.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/application.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes');
    test('routes/application.js should pass jshint', function() { 
      ok(true, 'routes/application.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/drive-admin.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes');
    test('routes/drive-admin.js should pass jshint', function() { 
      ok(false, 'routes/drive-admin.js should pass jshint.\nroutes/drive-admin.js: line 9, col 7, Forgotten \'debugger\' statement?\n\n1 error'); 
    });
  });
define("discette/tests/routes/drive-admin/default.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/drive-admin');
    test('routes/drive-admin/default.js should pass jshint', function() { 
      ok(true, 'routes/drive-admin/default.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/drive-admin/discettes/details.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/drive-admin/discettes');
    test('routes/drive-admin/discettes/details.js should pass jshint', function() { 
      ok(true, 'routes/drive-admin/discettes/details.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/drive-admin/sections/default.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/drive-admin/sections');
    test('routes/drive-admin/sections/default.js should pass jshint', function() { 
      ok(true, 'routes/drive-admin/sections/default.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/drive-admin/sections/details.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/drive-admin/sections');
    test('routes/drive-admin/sections/details.js should pass jshint', function() { 
      ok(true, 'routes/drive-admin/sections/details.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/home.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes');
    test('routes/home.js should pass jshint', function() { 
      ok(true, 'routes/home.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/home/about.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/home');
    test('routes/home/about.js should pass jshint', function() { 
      ok(true, 'routes/home/about.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/home/default.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/home');
    test('routes/home/default.js should pass jshint', function() { 
      ok(true, 'routes/home/default.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/home/manage.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/home');
    test('routes/home/manage.js should pass jshint', function() { 
      ok(true, 'routes/home/manage.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/index.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes');
    test('routes/index.js should pass jshint', function() { 
      ok(true, 'routes/index.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/micro-forums.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes');
    test('routes/micro-forums.js should pass jshint', function() { 
      ok(true, 'routes/micro-forums.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/overview/default.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes/overview');
    test('routes/overview/default.js should pass jshint', function() { 
      ok(true, 'routes/overview/default.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/start.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes');
    test('routes/start.js should pass jshint', function() { 
      ok(true, 'routes/start.js should pass jshint.'); 
    });
  });
define("discette/tests/routes/topic.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - routes');
    test('routes/topic.js should pass jshint', function() { 
      ok(true, 'routes/topic.js should pass jshint.'); 
    });
  });
define("discette/tests/services/api.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - services');
    test('services/api.js should pass jshint', function() { 
      ok(true, 'services/api.js should pass jshint.'); 
    });
  });
define("discette/tests/services/settings.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - services');
    test('services/settings.js should pass jshint', function() { 
      ok(true, 'services/settings.js should pass jshint.'); 
    });
  });
define("discette/tests/test-helper", 
  ["discette/tests/helpers/resolver","ember-qunit"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var resolver = __dependency1__["default"];
    var setResolver = __dependency2__.setResolver;

    setResolver(resolver);

    document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

    QUnit.config.urlConfig.push({ id: 'nocontainer', label: 'Hide container'});
    var containerVisibility = QUnit.urlParams.nocontainer ? 'hidden' : 'visible';
    document.getElementById('ember-testing-container').style.visibility = containerVisibility;
  });
define("discette/tests/unit/components/discette-header-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleForComponent = __dependency1__.moduleForComponent;
    var test = __dependency1__.test;

    moduleForComponent('discette-header', 'DiscetteHeaderComponent', {
      // specify the other units that are required for this test
      // needs: ['component:foo', 'helper:bar']
    });

    test('it renders', function() {
      expect(2);

      // creates the component instance
      var component = this.subject();
      equal(component._state, 'preRender');

      // appends the component to the page
      this.append();
      equal(component._state, 'inDOM');
    });
  });
define("discette/tests/unit/components/pagedown-bootstrap-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleForComponent = __dependency1__.moduleForComponent;
    var test = __dependency1__.test;

    moduleForComponent('pagedown-bootstrap', 'PagedownBootstrapComponent', {
      // specify the other units that are required for this test
      // needs: ['component:foo', 'helper:bar']
    });

    test('it renders', function() {
      expect(2);

      // creates the component instance
      var component = this.subject();
      equal(component._state, 'preRender');

      // appends the component to the page
      this.append();
      equal(component._state, 'inDOM');
    });
  });
define("discette/tests/unit/components/post-details-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleForComponent = __dependency1__.moduleForComponent;
    var test = __dependency1__.test;

    moduleForComponent('post-details', 'PostDetailsComponent', {
      // specify the other units that are required for this test
      // needs: ['component:foo', 'helper:bar']
    });

    test('it renders', function() {
      expect(2);

      // creates the component instance
      var component = this.subject();
      equal(component._state, 'preRender');

      // appends the component to the page
      this.append();
      equal(component._state, 'inDOM');
    });
  });
define("discette/tests/unit/controllers/application-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('controller:application', 'ApplicationController', {
      // Specify the other units that are required for this test.
      // needs: ['controller:foo']
    });

    // Replace this with your real tests.
    test('it exists', function() {
      var controller = this.subject();
      ok(controller);
    });
  });
define("discette/tests/unit/controllers/modal-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('controller:modal', 'ModalController', {
      // Specify the other units that are required for this test.
      // needs: ['controller:foo']
    });

    // Replace this with your real tests.
    test('it exists', function() {
      var controller = this.subject();
      ok(controller);
    });
  });
define("discette/tests/unit/controllers/modal/log-in-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('controller:modal/log-in', 'ModalLogInController', {
      // Specify the other units that are required for this test.
      // needs: ['controller:foo']
    });

    // Replace this with your real tests.
    test('it exists', function() {
      var controller = this.subject();
      ok(controller);
    });
  });
define("discette/tests/unit/controllers/modal/new-topic-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('controller:modal/new-topic', 'ModalNewTopicController', {
      // Specify the other units that are required for this test.
      // needs: ['controller:foo']
    });

    // Replace this with your real tests.
    test('it exists', function() {
      var controller = this.subject();
      ok(controller);
    });
  });
define("discette/tests/unit/models/topic-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleForModel = __dependency1__.moduleForModel;
    var test = __dependency1__.test;

    moduleForModel('topic', 'Topic', {
      // Specify the other units that are required for this test.
      needs: []
    });

    test('it exists', function() {
      var model = this.subject();
      // var store = this.store();
      ok(!!model);
    });
  });
define("discette/tests/unit/routes/application-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('route:application', 'ApplicationRoute', {
      // Specify the other units that are required for this test.
      // needs: ['controller:foo']
    });

    test('it exists', function() {
      var route = this.subject();
      ok(route);
    });
  });
define("discette/tests/unit/routes/home-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('route:home', 'HomeRoute', {
      // Specify the other units that are required for this test.
      // needs: ['controller:foo']
    });

    test('it exists', function() {
      var route = this.subject();
      ok(route);
    });
  });
define("discette/tests/unit/routes/topic-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('route:topic', 'TopicRoute', {
      // Specify the other units that are required for this test.
      // needs: ['controller:foo']
    });

    test('it exists', function() {
      var route = this.subject();
      ok(route);
    });
  });
define("discette/tests/unit/services/settings-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('service:settings', 'SettingsService', {
      // Specify the other units that are required for this test.
      // needs: ['service:foo']
    });

    // Replace this with your real tests.
    test('it exists', function() {
      var service = this.subject();
      ok(service);
    });
  });
define("discette/tests/unit/views/home/manage-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('view:home/manage', 'HomeManageView');

    // Replace this with your real tests.
    test('it exists', function() {
      var view = this.subject();
      ok(view);
    });
  });
define("discette/tests/unit/views/modal-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('view:modal', 'ModalView');

    // Replace this with your real tests.
    test('it exists', function() {
      var view = this.subject();
      ok(view);
    });
  });
define("discette/tests/unit/views/modal/log-in-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('view:modal/log-in', 'ModalLogInView');

    // Replace this with your real tests.
    test('it exists', function() {
      var view = this.subject();
      ok(view);
    });
  });
define("discette/tests/unit/views/modal/new-topic-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('view:modal/new-topic', 'ModalNewTopicView');

    // Replace this with your real tests.
    test('it exists', function() {
      var view = this.subject();
      ok(view);
    });
  });
define("discette/tests/unit/views/user-dropdown-test", 
  ["ember-qunit"],
  function(__dependency1__) {
    "use strict";
    var moduleFor = __dependency1__.moduleFor;
    var test = __dependency1__.test;

    moduleFor('view:user-dropdown', 'UserDropdownView');

    // Replace this with your real tests.
    test('it exists', function() {
      var view = this.subject();
      ok(view);
    });
  });
define("discette/tests/views/home/manage.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - views/home');
    test('views/home/manage.js should pass jshint', function() { 
      ok(true, 'views/home/manage.js should pass jshint.'); 
    });
  });
define("discette/tests/views/modal.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - views');
    test('views/modal.js should pass jshint', function() { 
      ok(true, 'views/modal.js should pass jshint.'); 
    });
  });
define("discette/tests/views/modal/confirm-action.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - views/modal');
    test('views/modal/confirm-action.js should pass jshint', function() { 
      ok(true, 'views/modal/confirm-action.js should pass jshint.'); 
    });
  });
define("discette/tests/views/modal/edit-post.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - views/modal');
    test('views/modal/edit-post.js should pass jshint', function() { 
      ok(true, 'views/modal/edit-post.js should pass jshint.'); 
    });
  });
define("discette/tests/views/modal/log-in.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - views/modal');
    test('views/modal/log-in.js should pass jshint', function() { 
      ok(true, 'views/modal/log-in.js should pass jshint.'); 
    });
  });
define("discette/tests/views/modal/new-topic.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - views/modal');
    test('views/modal/new-topic.js should pass jshint', function() { 
      ok(true, 'views/modal/new-topic.js should pass jshint.'); 
    });
  });
define("discette/tests/views/user-dropdown.jshint", 
  [],
  function() {
    "use strict";
    module('JSHint - views');
    test('views/user-dropdown.js should pass jshint', function() { 
      ok(true, 'views/user-dropdown.js should pass jshint.'); 
    });
  });
define("discette/views/home/manage", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.View.extend({
    });
  });
define("discette/views/modal", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    __exports__["default"] = Ember.View.extend({
    });

    var Ember = __dependency1__["default"];
    var ModalView;

    ModalView = Ember.View.extend({
      tagName: 'div',
      classNames: ['modal'],
      attributeBindings: ['tabindex'],
      tabindex: "-1",
      didInsertElement: function() {
        // debugger;
        var $modal = this.$();
        // $modal.attr('id', 'modal');
        $modal.modal({
          keyboard: true,
          backdrop: true
        });
        $modal.modal('show');
        var self = this;
        $modal.one("hide.bs.modal", function () {
          self.get("controller").send("closeModal");
        });
      },

      flashMessageChanged: function() {
        var flashMessage = this.get('controller.flashMessage');
        if (flashMessage) {
          var messageClass = flashMessage.get('messageClass') || 'success';
          var $alert = $('#modal-alert').hide().removeClass('alert-error', 'alert-success');
          $alert.addClass("alert alert-" + messageClass).html(flashMessage.get('message'));
          $alert.fadeIn();
        }
      }.observes('controller.flashMessage')


      //   _setupModal: function() {
      //   var self = this,
      //       $discourseModal = $('#discourse-modal');

      //   $discourseModal.modal('show');
      //   $discourseModal.one("hide", function () {
      //     self.get("controller").send("closeModal");
      //   });

      //   $('#modal-alert').hide();

      //   // Focus on first element
      //   if (!Discourse.Mobile.mobileView && self.get('focusInput')) {
      //     Em.run.schedule('afterRender', function() {
      //       self.$('input:first').focus();
      //     });
      //   }

      //   var title = this.get('title');
      //   if (title) {
      //     this.set('controller.controllers.modal.title', title);
      //   }
      // }.on('didInsertElement'),


      // willDestroyElement: function() {
      //   debugger;
      //   return this.$().modal('hide');
      // }
    });

    __exports__["default"] = ModalView;
  });
define("discette/views/modal/confirm-action", 
  ["discette/views/modal","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var ModalView = __dependency1__["default"];

    __exports__["default"] = ModalView.extend({


    });
  });
define("discette/views/modal/edit-post", 
  ["discette/views/modal","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var ModalView = __dependency1__["default"];
    var EditPostModalView;

    EditPostModalView = ModalView.extend({


    });

    __exports__["default"] = EditPostModalView;
  });
define("discette/views/modal/log-in", 
  ["discette/views/modal","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var ModalView = __dependency1__["default"];
    var LogInModalView;

    LogInModalView = ModalView.extend({
      // mouseMove: function(e) {
      //   this.set('controller.lastX', e.screenX);
      //   this.set('controller.lastY', e.screenY);
      // },

      _setup: function() {
        var loginController = this.get('controller');

        // Get username and password from the browser's password manager,
        // if it filled the hidden static login form:
        loginController.set('loginName', $('#hidden-login-form input[name=username]').val());
        loginController.set('loginPassword', $('#hidden-login-form input[name=password]').val());

        Em.run.schedule('afterRender', function() {
          $('#login-account-password, #login-account-name').keydown(function(e) {
            if (e.keyCode === 13) {
              if (!loginController.get('loginDisabled')) {
                loginController.send('login');
              }
            }
          });
        });
      }.on('didInsertElement')


    });

    __exports__["default"] = LogInModalView;
  });
define("discette/views/modal/new-topic", 
  ["discette/views/modal","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var ModalView = __dependency1__["default"];
    var NewTopicModalView;

    NewTopicModalView = ModalView.extend({


    });

    __exports__["default"] = NewTopicModalView;
  });
define("discette/views/user-dropdown", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    __exports__["default"] = Ember.View.extend({
      actions: {

      }
    });
  });
/* jshint ignore:start */

define('discette/config/environment', ['ember'], function(Ember) {
  var prefix = 'discette';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("discette/tests/test-helper");
} else {
  require("discette/app")["default"].create({});
}

/* jshint ignore:end */
//# sourceMappingURL=discette.map