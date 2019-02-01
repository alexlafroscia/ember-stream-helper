# ember-stream-helper

[![Build Status](https://travis-ci.com/alexlafroscia/ember-stream-helper.svg?branch=master)](https://travis-ci.com/alexlafroscia/ember-stream-helper)
[![NPM Version](https://badgen.net/npm/v/ember-stream-helper)](https://www.npmjs.com/package/ember-stream-helper)

> Base class for creating helpers that emit values over time

Most of the time, [Ember Helpers][ember-helper] are thought of as pure functions that take some input, transform it, and return a new output. Helpers can actually do a lot more than that, though -- because they can recompute themselves, they can react to events and emit a new value even when their inputs have not changed. After using this pattern a few times, I thought it might be useful to extract out a base class that can be used to simplify this pattern.

## Usage

Let's talk through an example of how you might use this class.

Imagine we have a [service][ember-service] that connects to a `WebSocket` and emits an event when the number of "likes" on a blog post changes. Our helper will want to do four things:

1. Take a `post` as an input
2. Tell the service to subscribe to those events
3. Produce a new value each time the event happens
4. Unsubscribe from the events when it's done.

An implementation might look something like this:

```javascript
// app/helpers/post-likes.js
import StreamHelper from "ember-stream-helper";
import { inject as service } from "@ember-decorators/service";

export default class LikesOnPost extends StreamHelper {
  /** This is our theoretical services that emits events about posts */
  @service blogPostEvents;

  /**
   * (1) The `subscribe` method is where we should set up a subscription to our
   *     source of events
   *
   *     It is passed the same arguments as the `compute` hook that a Helper normally
   *     has
   */
  subscribe([post]) {
    const callback = numberOfLikes => {
      // (3) The `emit` method is used to produce a new value. Each time `emit` is
      //     called, the argument passed in will be returned from the helper into the
      //     template
      this.emit(numberOfLikes);
    };

    // (2) We'll invoke the callback when a "likes" event takes place. This part will
    //     differ based on how the events are communicated in your specific API
    this.blogPostEvents.on(post, "likes", callback);

    // (4) We return a function from `subscribe` that performs whatever cleanup logic
    //     is required to clean up the subscription
    return () => {
      this.blogPostEvents.off(post, "likes", callback);
    };
  }
}
```

Now, you can use the helper in a template like this:

```hbs
There are {{post-likes post}} likes!
```

As your `blogPostEvents` service emits new numbers of "likes", your template will stay updated in real-time!

### Parameter Changes

The `StreamHelper` class will handle running your `unsubscribe` callback when the parameters to the helper change and calling `subscribe` againw with the new values. This means that `subscribe` can be called multiple times during the "lifespan" of the helper.

### The `unsubscribe` callback

Make sure that you return any required cleanup logic in from `subscribe` -- do **not** perform it yourself in `willDestroy`. Any "cleanup" logic should be run both when the helper is destroyed _and_ when the parameters change and we're preparing to subscribe again with the new values. `StreamHelper` takes care of this for you, if you return the `unsubscribe` logic from `subscribe`!

## Installation

```bash
ember install ember-stream-helper
```

## Compatibility

- Ember.js v2.18 or above
- Ember CLI v2.13 or above

## Prior Art and Influences

### [`ember-drafts`][ember-drafts]

This is an addon that I created recently at work, where I first played around with the idea of a helper that takes one input and emits many outputs over time. Specifically, the original object was passed in, and a new draft state was emitted each time the draft was changed.

### [React's `useEffect` hook][use-effect]

I designed the `unsubscribe` callback API based on the `useEffect` hook in React, which follows the same pattern of returning a callback to perform cleanup logic.

## License

This project is licensed under the [MIT License](LICENSE.md).

[ember-helper]: https://guides.emberjs.com/release/templates/writing-helpers/#toc_class-based-helpers
[ember-service]: https://guides.emberjs.com/release/applications/services
[ember-drafts]: https://github.com/alexlafroscia/ember-drafts
[use-effect]: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
