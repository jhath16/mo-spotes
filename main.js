(function () {
  App = {};
  App.Views = {};
  App.Models = {};
  App.renderedViews = [];
})();

function removeAllViews() {
  _.each(App.renderedViews, function (view) {
    view.remove();
  });
};

App.Views.HomeView = Backbone.View.extend({
  initialize:function () {
    console.log("Initialized home view");
    this.render();
    this.loadGames();
  },

  template: _.template($('#home').text()),

  render: function () {
    this.$el.html(this.template());
    $("body").append(this.el);

    App.renderedViews.push(this);
  },

  loadGames:function () {
    var self = this;
    firebase.database().ref('games').once("value", function (e) {
      var games = e.val();
      var gameObjectKeys = Object.keys(games);
      for (var i = 0; i < gameObjectKeys.length; i++ ) {
        games[gameObjectKeys[i]].href = gameObjectKeys[i];
      }
      _.each(games,function(i) {
        console.log(i);
        var template = _.template($('#game-tile').text());
        var compiledTemplate = template(i);
        self.$el.find('.games-container').append(compiledTemplate);
      });
    });
  }
});

App.Views.GameView = Backbone.View.extend({
  initialize:function (id) {
    console.log("Initialized game view");
    this.gameId = id;
    var self = this;
    firebase.database().ref('games/' + id).once('value', function (e) {
      self.render(e.val());
    });
    this.render();
  },

  className:"game-page-container",

  template: _.template($('#game-page').text()),

  render: function (e) {
    this.$el.html(this.template(e));
    $("body").append(this.el);

    App.renderedViews.push(this);
  },

  events: {
    'keydown input' : 'handleInput'
  },

  handleInput: function () {
    if (event.keyCode == 13) {
      this.sendMessage();
    }
  },

  sendMessage: function () {
    var message = this.$el.find('input').val();
    console.log(message);
    var messageObject = {
      createdAtTime: new moment().utc().toISOString(),
      message: message,
      createdBy: firebase.auth().currentUser.uid
    }

    firebase.database().ref('games/' + this.gameId + '/messages').push(messageObject);

    //this.appendMessage(messageObject)
  },

  appendMessage: function (messageObject) {
    //this.$el.find('.message-container').append(some template with dynamic info)
  }
});


App.Views.LoginView = Backbone.View.extend({
  initialize:function () {
    console.log("Initialized login view");
    this.render();
  },

  template: _.template($('#login').text()),

  render: function () {
    this.$el.html(this.template());
    $("body").append(this.el);

    App.renderedViews.push(this);
  },

  events: {
    'submit form.sign-up' : 'signUp',
    'submit form.login' : 'login'
  },

  signUp:function (e) {
    e.preventDefault();

    var email = this.$el.find('.sign-up input[name="email"]').val();
    var displayName = this.$el.find('.sign-up input[name="display-name"]').val();
    var password = this.$el.find('.sign-up input[name="password"]').val();
    firebase.auth().createUserWithEmailAndPassword(email,password).then(function (e) {
      return e;
    }).then(function (user) {
      firebase.database().ref('users/' + user.uid).set({
        email:email,
        displayName:displayName
      });
      App.Router.navigate('',{trigger:true});
    });
  },

  login:function (e) {
    e.preventDefault();

    var email = this.$el.find('.login input[name="email"]').val();
    var password = this.$el.find('.login input[name="password"]').val();

    firebase.auth().signInWithEmailAndPassword(email,password).then(function (user) {
      App.Router.navigate('',{trigger:true});
    });
  }
});

var Router = Backbone.Router.extend({
  initialize:function () {
    console.log("Initialized router");
  },

  routes: {
    '' : 'home',
    'login' : 'login',
    'games/:id' : 'game'
  },

  execute: function (callback, args) {
    removeAllViews();
    if (!firebase.auth().currentUser) {
      this.navigate('login');
      this.login();
      return false;
    }
    if (callback) callback.apply(this, args);
  },

  home: function () {
    new App.Views.HomeView();
  },

  login:function () {
    new App.Views.LoginView();
  },

  game: function (id) {
    new App.Views.GameView(id);
  }
});

$(document).ready(function () {
  App.Router = new Router();
  Backbone.history.start();
});
