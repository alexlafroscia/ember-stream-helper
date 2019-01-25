import BaseSubscriptionHelper from "ember-stream-helper";
import { inject as service } from "@ember-decorators/service";

export default class MostRecentEvent extends BaseSubscriptionHelper {
  @service events;

  subscribe() {
    const callback = data => {
      this.emit(data);
    };

    this.get("events").on("event", callback);

    return () => {
      this.get("events").off("event", callback);
    };
  }
}
