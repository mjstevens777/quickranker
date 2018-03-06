import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  store: inject('store'),

  setRoot() {
    this.set(
      'root',
      this.get('model.segments').filter((s) => s.get('root'))[0]
    );
  },

  getNext(segment) {
    if (segment.get('left.writeComplete') && segment.get('right.writeComplete')) {
      return segment
    }

    let queue = []
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
      index: insertIndex,
    });
    segEntry.save();

    better.set('readHead', better.get('readHead') + 1);

    if (better.get('readComplete')) {
      for (let i = worse.get('readHead'); i < worse.get('length'); i++) {
        insertIndex++;

        let segEntry = this.get('store').createRecord('segment-entry', {
          segment: this.get('nextChoice'),
          entry: worse.get('top'),
          index: insertIndex,
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
    this.get('store').peekAll('segment-entry').forEach( (segmentEntry) => {
      segmentEntry.destroyRecord();
    });
    this.get('store').peekAll('segment').forEach( (segment) => {
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
    return segment
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
      record.save().then( () => {
        this._recomputeSegments();
      });
    },

    deleteEntry(entry) {
      entry.destroyRecord().then( () => {
        this._recomputeSegments();
      });
    },

    rerank() {
      this._recomputeSegments();
    }
  }
});
