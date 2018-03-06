"use strict";

define('ember-quickstart/adapters/application', ['exports', 'ember-localstorage-adapter'], function (exports, _emberLocalstorageAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberLocalstorageAdapter.default.extend({
    namespace: 'quickranker'
  });
});
define('ember-quickstart/adapters/ls-adapter', ['exports', 'ember-localstorage-adapter/adapters/ls-adapter'], function (exports, _lsAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _lsAdapter.default;
});
define('ember-quickstart/app', ['exports', 'ember-quickstart/resolver', 'ember-load-initializers', 'ember-quickstart/config/environment'], function (exports, _resolver, _emberLoadInitializers, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const App = Ember.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });

  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  exports.default = App;
});
define('ember-quickstart/components/welcome-page', ['exports', 'ember-welcome-page/components/welcome-page'], function (exports, _welcomePage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _welcomePage.default;
    }
  });
});
define('ember-quickstart/controllers/application', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    store: Ember.inject.service('store'),

    setRoot() {
      this.set('root', this.get('model.segments').filter(s => s.get('root'))[0]);
    },

    getNext(segment) {
      if (segment.get('left.writeComplete') && segment.get('right.writeComplete')) {
        return segment;
      }

      let queue = [];
      if (!segment.get('left.writeComplete')) {
        queue.push(segment.get('left'));
      }
      if (!segment.get('right.writeComplete')) {
        queue.push(segment.get('right'));
      }

      let idx = Math.floor(Math.random() * queue.length);

      return this.getNext(queue[idx]);
    },

    setNext() {
      if (this.get('root') == null) {
        this.set('nextChoice', null);
        this.set('completed', false);
        this.set('empty', true);
      } else if (this.get('root.writeComplete')) {
        this.set('nextChoice', null);
        this.set('completed', true);
        this.set('empty', false);
      } else {
        this.set('nextChoice', this.getNext(this.get('root')));
        this.set('completed', false);
        this.set('empty', false);
      }
      this.set('flipLeftRight', Math.random() > 0.5);
    },

    step(better, worse) {
      let insertIndex = this.get('nextChoice.segmentEntries.length');
      let segEntry = this.get('store').createRecord('segment-entry', {
        segment: this.get('nextChoice'),
        entry: better.get('top'),
        index: insertIndex
      });
      segEntry.save();

      better.set('readHead', better.get('readHead') + 1);

      if (better.get('readComplete')) {
        for (let i = worse.get('readHead'); i < worse.get('length'); i++) {
          insertIndex++;

          let segEntry = this.get('store').createRecord('segment-entry', {
            segment: this.get('nextChoice'),
            entry: worse.get('top'),
            index: insertIndex
          });
          segEntry.save();

          worse.set('readHead', worse.get('readHead') + 1);
        }
      }

      if (better.get('readComplete') && worse.get('readComplete')) {
        better.destroyRecord();
        worse.destroyRecord();
      } else {
        better.save();
        worse.save();
      }
    },

    _recomputeSegments() {
      this.get('store').peekAll('segment-entry').forEach(segmentEntry => {
        segmentEntry.destroyRecord();
      });
      this.get('store').peekAll('segment').forEach(segment => {
        segment.destroyRecord();
      });
      let root = this._generateSegments(this.get('store').peekAll('entry').slice());
      if (root != null) {
        root.set('root', true);
        root.save();
      }
      this.set('root', root);
      this.setNext();
    },

    _generateSegments(data) {
      if (data.length == 0) {
        return null;
      }

      let segment = this.get('store').createRecord('segment', {
        length: data.length,
        readHead: 0,
        root: false
      });

      if (data.length == 1) {
        let segmentEntry = this.get('store').createRecord('segment-entry', {
          segment: segment,
          entry: data[0],
          index: 0
        });
        segmentEntry.save();
      } else {
        let midpoint = Math.floor(data.length / 2);
        let leftData = data.slice(0, midpoint);
        segment.set('left', this._generateSegments(leftData));
        let rightData = data.slice(midpoint);
        segment.set('right', this._generateSegments(rightData));
      }
      segment.save();
      return segment;
    },

    actions: {
      left() {
        this.step(this.get('nextChoice.left'), this.get('nextChoice.right'));
        this.setNext();
      },

      right() {
        this.step(this.get('nextChoice.right'), this.get('nextChoice.left'));
        this.setNext();
      },

      addEntry() {
        let record = this.get('store').createRecord('entry', {
          name: this.get('newEntryName')
        });
        this.set('newEntryName', '');
        record.save().then(() => {
          this._recomputeSegments();
        });
      },

      deleteEntry(entry) {
        entry.destroyRecord().then(() => {
          this._recomputeSegments();
        });
      },

      rerank() {
        this._recomputeSegments();
      }
    }
  });
});
define('ember-quickstart/helpers/app-version', ['exports', 'ember-quickstart/config/environment', 'ember-cli-app-version/utils/regexp'], function (exports, _environment, _regexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.appVersion = appVersion;


  const {
    APP: {
      version
    }
  } = _environment.default;

  function appVersion(_, hash = {}) {
    if (hash.hideSha) {
      return version.match(_regexp.versionRegExp)[0];
    }

    if (hash.hideVersion) {
      return version.match(_regexp.shaRegExp)[0];
    }

    return version;
  }

  exports.default = Ember.Helper.helper(appVersion);
});
define('ember-quickstart/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _pluralize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _pluralize.default;
});
define('ember-quickstart/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _singularize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _singularize.default;
});
define('ember-quickstart/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'ember-quickstart/config/environment'], function (exports, _initializerFactory, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let name, version;
  if (_environment.default.APP) {
    name = _environment.default.APP.name;
    version = _environment.default.APP.version;
  }

  exports.default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
});
define('ember-quickstart/initializers/container-debug-adapter', ['exports', 'ember-resolver/resolvers/classic/container-debug-adapter'], function (exports, _containerDebugAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'container-debug-adapter',

    initialize() {
      let app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('ember-quickstart/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data'], function (exports, _setupContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-data',
    initialize: _setupContainer.default
  };
});
define('ember-quickstart/initializers/export-application-global', ['exports', 'ember-quickstart/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function () {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports.default = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define("ember-quickstart/instance-initializers/ember-data", ["exports", "ember-data/initialize-store-service"], function (exports, _initializeStoreService) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: "ember-data",
    initialize: _initializeStoreService.default
  };
});
define('ember-quickstart/models/entry', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string')
  });
});
define('ember-quickstart/models/segment-entry', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    segment: _emberData.default.belongsTo('segment'),
    entry: _emberData.default.belongsTo('entry'),
    index: _emberData.default.attr('number')
  });
});
define('ember-quickstart/models/segment', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    left: _emberData.default.belongsTo('segment', { inverse: null, async: false }),
    right: _emberData.default.belongsTo('segment', { inverse: null, async: false }),
    segmentEntries: _emberData.default.hasMany('segment-entry'),
    readHead: _emberData.default.attr('number'),
    length: _emberData.default.attr('number'),
    root: _emberData.default.attr('boolean'),

    sortedEntries: Ember.computed('segmentEntries.@each.index', function () {
      let segEntries = this.get('segmentEntries').slice();
      segEntries.sort((a, b) => {
        a.get('index') - b.get('index');
      });
      let entries = segEntries.map(e => e.get('entry'));
      return entries;
    }),

    top: Ember.computed('sortedEntries', 'readHead', function () {
      return this.get('sortedEntries')[this.get('readHead')];
    }),

    writeComplete: Ember.computed('segmentEntries.length', 'length', function () {
      return this.get('segmentEntries.length') == this.get('length');
    }),

    readComplete: Ember.computed('readHead', 'length', function () {
      return this.get('readHead') == this.get('length');
    })
  });
});
define('ember-quickstart/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberResolver.default;
});
define('ember-quickstart/router', ['exports', 'ember-quickstart/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const Router = Ember.Router.extend({
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL
  });

  Router.map(function () {});

  exports.default = Router;
});
define('ember-quickstart/routes/application', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    model() {
      return Ember.RSVP.hash({
        'entries': this.store.findAll('entry'),
        'segments': this.store.findAll('segment'),
        'segmentEntries': this.store.findAll('segment-entry')
      });
    },

    setupController(controller) {
      this._super(...arguments);

      controller.setRoot();
      controller.setNext();
    }
  });
});
define('ember-quickstart/serializers/application', ['exports', 'ember-localstorage-adapter'], function (exports, _emberLocalstorageAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberLocalstorageAdapter.LSSerializer.extend();
});
define('ember-quickstart/serializers/ls-serializer', ['exports', 'ember-localstorage-adapter/serializers/ls-serializer'], function (exports, _lsSerializer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _lsSerializer.default;
});
define('ember-quickstart/services/ajax', ['exports', 'ember-ajax/services/ajax'], function (exports, _ajax) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _ajax.default;
    }
  });
});
define("ember-quickstart/templates/application", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "mC20zYM2", "block": "{\"symbols\":[\"entry\",\"entry\"],\"statements\":[[6,\"h1\"],[7],[0,\"Quick Ranker\"],[8],[0,\"\\n\"],[6,\"h3\"],[7],[0,\"Add a new item\"],[8],[0,\"\\n\\n\"],[1,[25,\"input\",null,[[\"value\",\"enter\"],[[20,[\"newEntryName\"]],\"addEntry\"]]],false],[0,\"\\n\\n\"],[6,\"h3\"],[7],[0,\"Your items:\"],[8],[0,\"\\n\\n\"],[4,\"each\",[[20,[\"model\",\"entries\"]]],null,{\"statements\":[[0,\"  \"],[6,\"li\"],[7],[0,\"\\n    \"],[1,[19,2,[\"name\"]],false],[0,\"\\n    \"],[6,\"button\"],[3,\"action\",[[19,0,[]],\"deleteEntry\",[19,2,[]]]],[7],[0,\"delete\"],[8],[0,\"\\n  \"],[8],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"\\n\"],[6,\"h3\"],[7],[0,\"Ranking\"],[8],[0,\"\\n\\n\"],[4,\"if\",[[20,[\"empty\"]]],null,{\"statements\":[[0,\"  Add some items in order to rank them\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[20,[\"completed\"]]],null,{\"statements\":[[0,\"    Your order is:\\n\"],[4,\"each\",[[20,[\"root\",\"sortedEntries\"]]],null,{\"statements\":[[0,\"    \"],[6,\"li\"],[7],[1,[19,1,[\"name\"]],false],[8],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"    \"],[6,\"button\"],[3,\"action\",[[19,0,[]],\"rerank\"]],[7],[0,\"Reset ranking\"],[8],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    Which is better?\\n\"],[4,\"if\",[[20,[\"flipLeftRight\"]]],null,{\"statements\":[[0,\"      \"],[6,\"button\"],[3,\"action\",[[19,0,[]],\"right\"]],[7],[1,[20,[\"nextChoice\",\"right\",\"top\",\"name\"]],false],[8],[0,\"\\n      \"],[6,\"button\"],[3,\"action\",[[19,0,[]],\"left\"]],[7],[1,[20,[\"nextChoice\",\"left\",\"top\",\"name\"]],false],[8],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"button\"],[3,\"action\",[[19,0,[]],\"left\"]],[7],[1,[20,[\"nextChoice\",\"left\",\"top\",\"name\"]],false],[8],[0,\"\\n      \"],[6,\"button\"],[3,\"action\",[[19,0,[]],\"right\"]],[7],[1,[20,[\"nextChoice\",\"right\",\"top\",\"name\"]],false],[8],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "ember-quickstart/templates/application.hbs" } });
});

define('ember-quickstart/config/environment', [], function() {
  var prefix = 'ember-quickstart';
try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(unescape(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

});

if (!runningTests) {
  require("ember-quickstart/app")["default"].create({"name":"ember-quickstart","version":"0.0.0+eada4cd0"});
}
//# sourceMappingURL=ember-quickstart.map
