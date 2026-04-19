/**
 * CSS Selectors for Genspark chat pages (genspark.ai)
 *
 * Targets the `/agents?id=...` chat UI.
 */

import type { SelectorGroup } from './types';

export const SELECTORS = {
  pageTitle: [
    '.conversation-statement.user .bubble pre code',
    '.conversation-statement.user .bubble',
  ],

  conversationTurn: [
    '.conversation-statement',
  ],

  userMessage: [
    '.conversation-item-desc.user .bubble pre code',
    '.conversation-item-desc.user .bubble pre',
    '.conversation-item-desc.user .bubble',
  ],

  assistantMessage: [
    '.conversation-item-desc.assistant .bubble .markdown-viewer',
    '.conversation-item-desc.assistant .bubble .content .markdown-viewer',
  ],

  conversationRoot: [
    '.general-chat-wrapper',
    '.chat-wrapper',
    '.conversation-wrapper',
  ],
} as const satisfies SelectorGroup;
