import DS from 'ember-data';
import { computed } from '@ember/object';

export default DS.Model.extend({
  segment: DS.belongsTo('segment'),
  entry: DS.belongsTo('entry'),
  index: DS.attr('number'),

  displayIndex: computed('index', function() {
    return this.get('index') + 1;
  })
});
