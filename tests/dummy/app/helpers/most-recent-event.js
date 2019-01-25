import BaseSubscriptionHelper from "ember-base-subscription-helper";
import { inject as service } from "@ember-decorators/service";

export default class MostRecentEvent extends BaseSubscriptionHelper {
  @service events;

  subscribe() {
    const callback = data => {
      this.emit(data);
    };

    this.events.on("event", callback);

    return () => {
      this.events.off("event", callback);
    };
  }
}
