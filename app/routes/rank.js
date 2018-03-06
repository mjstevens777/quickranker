import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default Route.extend({
  model() {
    return hash({
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
