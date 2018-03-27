import { Middleware, Entity, BotContext } from 'botbuilder';

export type RemoveBehavior = 'full' | 'tags' | 'none';

export interface StripMentionsOptions {
    botBehavior?: RemoveBehavior;
    userBehavior?: RemoveBehavior;
}

export class StripMentions implements Middleware {
    // Symbol for keying into context object
    private readonly contextKey: Symbol = Symbol('StripMentions');

    // Default values for all options
    private readonly options: StripMentionsOptions = {
        botBehavior: 'full',
        userBehavior: 'tags'
    };

    constructor(options: StripMentionsOptions = {}) {
        this.options = Object.assign(this.options, options);
    }

    public onProcessRequest(context: BotContext, next: () => Promise<void>) {
        // Ensure we have text, and save it as the original text
        if (!context.request.text) return next();
        context.set(this.contextKey, context.request.text);

        // Ensure we have the bot's ID
        const cRef = BotContext.getConversationReference(context.request);
        if (!cRef.bot || !cRef.bot.id) return next();
        const botId = cRef.bot.id;

        // Extract mention entities
        const mentionEnts = (context.request.entities || []).filter(e => e.type === 'mention') as MentionEntity[];

        // Strip bot at-mentions out of the message text
        if (this.options.botBehavior) {
            const botMentionEnts = mentionEnts.filter(e => e.mentioned.id === botId);
            context.request.text = stripMentions(context.request.text, botMentionEnts, this.options.botBehavior);
        }

        // Strip user at-mentions out of the message text
        if (this.options.userBehavior) {
            const otherMentionEnts = mentionEnts.filter(e => e.mentioned.id !== botId);
            context.request.text = stripMentions(context.request.text, otherMentionEnts, this.options.userBehavior);
        }

        // Continue middleware pipeline
        return next();
    }

    public getOriginalText(context: BotContext): string {
        return context.get(this.contextKey) as string;
    }
}

/**
 * Strips the given text of the given mentions
 * @param text The text to strip mentions from
 * @param mentions The mentions to look for in the text and strip away
 * @param behavior Determines the stripping behavior
 */
export function stripMentions(text: string, mentions: MentionEntity[], behavior: RemoveBehavior): string {
    if (behavior === 'none') {
        return text;
    }

    let ret = text;
    for (const mention of mentions) {
        const replaceWith = behavior === 'tags' ? getAtTagContent(mention.text) : '';
        ret = ret.replace(mention.text, replaceWith);
    }

    return ret;
}

/**
 * Returns the content within the <at> tags. For example, if the string is "<at>My Bot</at>", then this returns "My Bot"
 * @param str The string containing an <at> tag
 */
function getAtTagContent(str: string): string {
    // Capture the text between the "at" open/close tags
    const matchResult = str.match('<at>(.*)</at>');
    return matchResult ? matchResult[1] : '';
}

export interface MentionEntity extends Entity {
    type: 'mention';
    text: string;
    mentioned: {
        id: string;
        name: string;
    }
}