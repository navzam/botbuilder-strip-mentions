# Purpose

For use with the Microsoft Bot Builder SDK v4, particularly when developing a bot for Microsoft Teams. Users will often @mention the bot or other users within a Team, which pollutes incoming messages with often undesired `<at>` tags. This package helps strip these `<at>` tags from the message.

# Usage

## Option 1: Middleware

Your bot can `use()` this middleware as usual:

```ts
bot.use(new StripMentions())
```

The stripped text is placed in a new `strippedText` entity. The original message in `context.request.text` is not changed.

```ts
bot.use(new StripMentions())
    .onReceive(context => {
        const entity = context.request.entities
            .find(entity => entity.type === 'strippedText');
        console.log(`Original text: ${context.request.text}`);
        console.log(`Stripped text: ${entity.text}`);
    });
```

You can configure how the tags are stripped for your bot vs. for other users via the `StripMentions` constructor. See [Configuration](#configuration) for details.

```ts
// These are the default values for the middleware
new StripMentions({
    botMentionRemoveBehavior: 'whole',
    userMentionRemoveBehavior: 'tags'
})
```

## Option 2: Calling without middleware

Alternatively, you can call the strip logic yourself without using middleware:

```ts
bot.onReceive(context => {
    const mentions = context.request.entities.filter(e => e.type === 'mention');
    const strippedText = stripMentions(context.request.text, mentions, 'tags');
});
```

You can configure how the tags are stripped using the last parameter to `stripMentions`. See [Configuration](#configuration) for details.

## Configuration

The valid behaviors are
- `'whole'`: The tags and contained text are removed
- `'tags'`: Only the tags are removed
- `'none'`: Nothing is removed

For example, if the user typed
> **@Teams Bot** Schedule a meeting with **@John Smith**

then your bot would receive the string
>\<at>Teams Bot\</at> Schedule a meeting with \<at>John Smith\</at>

and the middleware (with the default values `'whole'` for bots and `'tags'` for users) would produce
> Schedule a meeting with John Smith