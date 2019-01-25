import Helper from "@ember/component/helper";
import { defer } from "rsvp";

function arraysMatch(first, second) {
  return first.reduce(
    (acc, item, currentIndex) => acc && item === second[currentIndex],
    true
  );
}

function objectsMatch(first, second) {
  for (const key in first) {
    if (first[key] !== second[key]) {
      return false;
    }
  }

  return true;
}

export default class BaseSubscriptionHelper extends Helper {
  init() {
    super.init(...arguments);

    this._previousParamers;
  }

  async begin() {
    this._deferred = defer();

    const asyncIterator = this.generate();
    for await (let result of asyncIterator) {
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

  _parametersHaveChanged(positionalParams, hashParams) {
    if (!this._previousParamers) {
      return true;
    }

    const [
      previousPositionalParams,
      previousHashParams
    ] = this._previousParamers;

    return (
      !arraysMatch(positionalParams, previousPositionalParams) ||
      !objectsMatch(hashParams, previousHashParams)
    );
  }

  /**
   * Compute can be called for two different reasons
   *
   * 1. When the helper's parameters change
   * 2. When `emit` is called in the parent class
   */
  compute(positionalParams, hashParams) {
    if (this._parametersHaveChanged(positionalParams, hashParams)) {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      this._previousParamers = [positionalParams, hashParams];

      this.begin();
      this.unsubscribe = this.subscribe(positionalParams, hashParams);
    } else {
      // TODO: emit was called; we don't have anything to do

      return this.lastValue;
    }

    return this.lastValue;
  }

  willDestroy() {
    super.willDestroy && super.willDestroy();

    this.unsubscribe && this.unsubscribe();
  }
}
