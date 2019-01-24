import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";
import { render, settled } from "@ember/test-helpers";
import hbs from "htmlbars-inline-precompile";
import BaseSubscriptionHelper from "ember-base-subscription-helper";
import { inject as service } from "@ember/service";

module("Integration | Helper | base-subscription-helper", function(hooks) {
  setupRenderingTest(hooks);

  test("not implementing `subscribe`", function(assert) {
    class NoSubscribe extends BaseSubscriptionHelper {}

    assert.throws(
      () => {
        NoSubscribe.create();
      },
      /Must implement \`subscribe\`/,
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

  module("reacting to events", function(hooks) {
    hooks.beforeEach(function() {
      this.events = this.owner.lookup("service:events");
      this.trigger = value => {
        this.events.trigger("event", value);
      };

      this.owner.register(
        "helper:respond-to-event",
        BaseSubscriptionHelper.extend({
          events: service(),

          subscribe() {
            this.events.on("event", data => {
              this.emit(data);
            });
          }
        })
      );
    });

    test("responding to events", async function(assert) {
      await render(hbs`
        {{respond-to-event}}
      `);

      assert.dom().hasText("", "No initial value");

      this.trigger(1);
      await settled();

      assert
        .dom()
        .hasText("1", "Displays the value from the first event event");

      this.trigger(2);
      await settled();

      assert.dom().hasText("2", "Displays the value from the second event");
    });

    test("presenting a default value", async function(assert) {
      await render(hbs`
        {{respond-to-event initialValue="Initial Value"}}
      `);

      assert.dom().hasText("Initial Value");
    });

    test("does not present the initial value when emitting something `falsy`", async function(assert) {
      await render(hbs`
        {{respond-to-event initialValue="Initial Value"}}
      `);

      this.trigger(undefined);
      await settled();

      assert.dom().hasText("");
    });
  });
});
