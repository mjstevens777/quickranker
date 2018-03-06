import DS from 'ember-data';
import { computed } from '@ember/object';

export default DS.Model.extend({
  left: DS.belongsTo('segment', { inverse: null, async: false }),
  right: DS.belongsTo('segment', { inverse: null, async: false }),
  segmentEntries: DS.hasMany('segment-entry'),
  readHead: DS.attr('number'),
  length: DS.attr('number'),
  root: DS.attr('boolean'),

  sortedEntries: computed('segmentEntries.@each.index', function() {
    let segEntries = this.get('segmentEntries').slice();
    segEntries.sort((a, b) => {a.get('index') - b.get('index')});
    let entries = segEntries.map((e) => e.get('entry'));
    return entries;
  }),

  top: computed('sortedEntries', 'readHead', function() {
    return this.get('sortedEntries')[this.get('readHead')];
  }),

  writeComplete: computed('segmentEntries.length', 'length',  function() {
    return this.get('segmentEntries.length') == this.get('length')
  }),

  readComplete: computed('readHead', 'length', function() {
    return this.get('readHead') == this.get('length');
  })
});
