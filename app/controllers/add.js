import Controller from '@ember/controller';

export default Controller.extend({
  store: Ember.inject.service(),

  _recomputeSegments() {
    this.get('store').peekAll('segment-entry').forEach( (segmentEntry) => {
      segmentEntry.destroyRecord();
    });
    this.get('store').peekAll('segment').forEach( (segment) => {
      segment.destroyRecord();
    });
    let root = this._generateSegments(this.get('store').peekAll('entry').slice());
    root.set('root', true);
    root.save();
  },

  _generateSegments(data) {
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
    return segment
  },

  actions: {
    addEntry() {
      let record = this.get('store').createRecord('entry', {
        name: this.get('newEntryName')
      });
      this.set('newEntryName', '');
      record.save().then( () => {
        this._recomputeSegments();
      });
    },

    deleteEntry(entry) {
      entry.destroyRecord().then( () => {
        this._recomputeSegments();
      });
    }
  }
});
