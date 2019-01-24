import Helper from "@ember/component/helper";
import { defer } from "rsvp";

export default class BaseSubscriptionHelper extends Helper {
  init() {
    super.init(...arguments);

    this._hasProducedValue = false;

    this.begin();
    this.subscribe();
  }

  async begin() {
    this._deferred = defer();

    const asyncIterator = this.generate();
    for await (let result of asyncIterator) {
      this._hasProducedValue = true;

      this.lastValue = result;
      this.recompute();
    }
  }

  subscribe() {
    throw new Error("Must implement `subscribe`");
  }

  emit(value) {
    this._deferred.resolve(value);
    this._deferred = defer();
  }

  async *generate() {
    while (!this.isDestroying && !this.isDestroyed) {
      let value = await this._deferred.promise;

      yield value;
    }
  }

  compute(positionalParams, { initialValue } = {}) {
    return this._hasProducedValue ? this.lastValue : initialValue;
  }
}
