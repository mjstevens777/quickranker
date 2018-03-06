import DS from 'ember-data';

export default DS.Model.extend({
  segment: DS.belongsTo('segment'),
  entry: DS.belongsTo('entry'),
  index: DS.attr('number')
});
