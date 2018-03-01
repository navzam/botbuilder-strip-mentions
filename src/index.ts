import { Middleware, Entity } from 'botbuilder';

export type RemoveBehavior = 'full' | 'tags' | 'none';

export interface StripMentionsOptions {
    botMentionRemoveBehavior?: RemoveBehavior;
    userMentionRemoveBehavior?: RemoveBehavior;
}

export class StripMentions implements Middleware {
    // Default values for all options
    private readonly options: StripMentionsOptions = {
        botMentionRemoveBehavior: 'full',
        userMentionRemoveBehavior: 'tags'
    };

    constructor(options: StripMentionsOptions = {}) {
        this.options = Object.assign(this.options, options);
    }

    public receiveActivity(context: BotContext, next: () => Promise<void>): Promise<void> {
        if (!context.conversationReference.bot || !context.request.text) {
            return next();
        }

        const botId = context.conversationReference.bot.id;

        // Extract mention entities
        if (context.request.entities === undefined) {
            context.request.entities = [];
        }
        const mentionEnts = context.request.entities.filter(e => e.type === 'mention') as MentionEntity[];
        
        let strippedText = context.request.text;

        // If enabled, strip bot at-mentions out of the message text
        if (this.options.botMentionRemoveBehavior && this.options.botMentionRemoveBehavior !== 'none') {
            const botMentionEnts = mentionEnts.filter(e => e.mentioned.id === botId);
            strippedText = stripMentions(strippedText, botMentionEnts, this.options.botMentionRemoveBehavior);
        }

        // If enabled, strip user at-mentions out of the message text
        if (this.options.userMentionRemoveBehavior && this.options.userMentionRemoveBehavior !== 'none') {
            const otherMentionEnts = mentionEnts.filter(e => e.mentioned.id !== botId);
            strippedText = stripMentions(strippedText, otherMentionEnts, this.options.userMentionRemoveBehavior);
        }

        // Push stripped text as an entity to the context object
        context.request.entities.push(<StrippedTextEntity>{
            type: 'strippedText',
            text: strippedText
        });

        // Continue middleware pipeline
        return next();
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

export interface StrippedTextEntity extends Entity {
    type: 'strippedText';
    text: string;
}

export interface MentionEntity extends Entity {
    type: 'mention';
    text: string;
    mentioned: {
        id: string;
        name: string;
    }
}