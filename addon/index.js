import Helper from "@ember/component/helper";
import { join } from "@ember/runloop";

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

    this._previousParameters;
  }

  subscribe() {
    throw new Error("Must implement `subscribe`");
  }

  emit(value) {
    this.lastValue = value;

    join(() => {
      this.recompute();
    });
  }

  _parametersHaveChanged(positionalParams, hashParams) {
    if (!this._previousParameters) {
      return true;
    }

    const [
      previousPositionalParams,
      previousHashParams
    ] = this._previousParameters;

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
      this.unsubscribe && this.unsubscribe();
      this._previousParameters = [positionalParams, hashParams];

      this.unsubscribe = this.subscribe(positionalParams, hashParams);
    }

    return this.lastValue;
  }

  willDestroy() {
    super.willDestroy && super.willDestroy();

    this.unsubscribe && this.unsubscribe();
  }
}
