# Purpose

For use with the Microsoft Bot Builder SDK v4, particularly when developing a bot for Microsoft Teams. Users will often @mention the bot or other users within a Team, which pollutes incoming messages with possibly undesired `<at>` tags. This package helps strip these `<at>` tags from the message.

For example, if the user typed
> **@Teams Bot** Schedule a meeting with **@John Smith**

then your bot would receive the string
>\<at>Teams Bot\</at> Schedule a meeting with \<at>John Smith\</at>

and this package could produce the string
> Schedule a meeting with John Smith

# Usage

## Option 1: Middleware

Your bot can `use()` this middleware as usual:

```ts
const stripMentions = new StripMentions();
adapter.use(stripMentions);
```

The stripped text is placed in `context.request.text`. You can retrieve the unstripped text using the `getOriginalText()` method. (Note that this may not be the truly original text, particularly if you're using other middleware that modifies `context.request.text` before this one.)

```ts
adapter.processRequest(req, res, context => {
    if (context.request.type === ActivityTypes.Message) {
        const originalText = stripMentions.getOriginalText(context);
        console.log(`Original text: ${originalText}`);
        console.log(`Stripped text: ${context.request.text}`);
    }
});
```

You can configure how the tags are stripped for your bot vs. for other users via the `StripMentions` constructor. See [Configuration](#configuration) for details.

```ts
// These are the default values for the middleware
new StripMentions({
    botBehavior: 'whole',
    userBehavior: 'tags'
})
```

## Option 2: Calling without middleware

Alternatively, you can call the strip logic yourself without using middleware:

```ts
adapter.processRequest(req, res, context => {
    if (context.request.type === ActivityTypes.Message) {
        const mentions = context.request.entities.filter(e => e.type === 'mention');
        const strippedText = stripMentions(context.request.text, mentions, 'tags');
    }
});
```

You can configure how the tags are stripped using the last parameter to `stripMentions()`. See [Configuration](#configuration) for details.

## Configuration

The valid behaviors are
- `whole`: The tags and contained text are removed
- `tags`: Only the tags are removed
- `none`: Nothing is removed

For example, for this example utterance from before:
> **@Teams Bot** Schedule a meeting with **@John Smith**

the middleware could produce the following:

| Bot behavior | User behavior | Stripped text                                 |
| ------------ | ------------- | --------------------------------------------- |
| `whole`      | `tags`        | Schedule a meeting with John Smith            |
| `tags`       | `tags`        | Teams Bot Schedule a meeting with John Smith  |
| `whole`      | `whole`       | Schedule a meeting with                       |