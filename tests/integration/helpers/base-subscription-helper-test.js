import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";
import { render, settled } from "@ember/test-helpers";
import hbs from "htmlbars-inline-precompile";
import BaseSubscriptionHelper from "ember-base-subscription-helper";

module("Integration | Helper | base-subscription-helper", function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.events = this.owner.lookup("service:events");
    this.trigger = value => {
      this.events.trigger("event", value);
      return settled();
    };
  });

  test("not implementing `subscribe`", function(assert) {
    class NoSubscribe extends BaseSubscriptionHelper {}

    assert.throws(
      () => {
        const helper = NoSubscribe.create();
        helper.compute();
      },
      /Must implement `subscribe`/,
      "Requires that `subscribe` is implemented"
    );
  });

  test("immediately emitting a value", async function(assert) {
    this.owner.register(
      "helper:immediately-emit-event",
      class ImmediatelyEmitEvent extends BaseSubscriptionHelper {
        subscribe() {
          this.emit(1);
        }
      }
    );

    await render(hbs`
      {{immediately-emit-event}}
    `);

    assert.dom().hasText("1");
  });

  test("responding to events", async function(assert) {
    await render(hbs`
      {{most-recent-event}}
    `);

    assert.dom().hasText("", "No initial value");

    await this.trigger(1);

    assert.dom().hasText("1", "Displays the value from the first event event");

    await this.trigger(2);

    assert.dom().hasText("2", "Displays the value from the second event");
  });
});
