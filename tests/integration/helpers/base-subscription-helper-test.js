import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";
import { render, settled, clearRender } from "@ember/test-helpers";
import hbs from "htmlbars-inline-precompile";
import td from "testdouble";
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

  module("subscribing based on params", function() {
    test("`subscribe` is passed positional params", async function(assert) {
      this.owner.register(
        "helper:positional-params",
        class PositionalParams extends BaseSubscriptionHelper {
          subscribe(positionalParams) {
            this.emit(JSON.stringify(positionalParams));
          }
        }
      );

      this.set("value", "foo");

      await render(hbs`
        {{positional-params value}} 
      `);

      assert.dom().hasText('["foo"]', "Renders the initial value");

      this.set("value", "bar");
      await settled();

      assert.dom().hasText('["bar"]', "Renders the updated value");
    });

    test("`subscribe` is passed hash params", async function(assert) {
      this.owner.register(
        "helper:hash-params",
        class HashParams extends BaseSubscriptionHelper {
          subscribe(_, hashParams) {
            this.emit(JSON.stringify(hashParams));
          }
        }
      );

      this.set("value", "foo");

      await render(hbs`
        {{hash-params value=value}} 
      `);

      assert.dom().hasText('{"value":"foo"}', "Renders the initial value");

      this.set("value", "bar");
      await settled();

      assert.dom().hasText('{"value":"bar"}', "Renders the updated value");
    });
  });

  module("calling the `unsubscribe` callback", function(hooks) {
    hooks.beforeEach(function() {
      const unsubscribe = td.function();

      this.owner.register(
        "helper:with-unsubscribe",
        class WithUnsubscribe extends BaseSubscriptionHelper {
          subscribe() {
            return unsubscribe;
          }
        }
      );
      this.unsubscribe = unsubscribe;
    });

    test("it unsubscribes when the params change", async function(assert) {
      this.set("value", "foo");

      await render(hbs`
        {{with-unsubscribe value}} 
      `);

      this.set("value", "bar");

      assert.verify(this.unsubscribe(), "Called the `unsubscribe` callback");
    });

    test("it unsubscribed when the helper is destroyed", async function(assert) {
      await render(hbs`
        {{with-unsubscribe}} 
      `);
      await clearRender();

      assert.verify(this.unsubscribe(), "Called the `unsubscribe` callback");
    });
  });
});
