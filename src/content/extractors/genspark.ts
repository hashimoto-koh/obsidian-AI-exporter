/**
 * Genspark Extractor
 *
 * Extracts chat conversations from Genspark (genspark.ai / www.genspark.ai).
 */

import { BaseExtractor } from './base';
import { sanitizeHtml } from '../../lib/sanitize';
import type { ConversationMessage } from '../../lib/types';

import { SELECTORS } from './selectors/genspark';

export class GensparkExtractor extends BaseExtractor {
  readonly platform = 'genspark';

  canExtract(): boolean {
    const { hostname, pathname, search } = window.location;
    const isSupportedHost = hostname === 'www.genspark.ai' || hostname === 'genspark.ai';
    return isSupportedHost && pathname === '/agents' && /(?:^|[?&])id=/.test(search);
  }

  getConversationId(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  getTitle(): string {
    const heading = this.queryWithFallback<HTMLElement>(SELECTORS.pageTitle);
    if (heading?.textContent) {
      return this.sanitizeText(heading.textContent);
    }

    return this.getPageTitle() ?? 'Untitled Genspark Conversation';
  }

  extractMessages(): ConversationMessage[] {
    const turns = this.queryAllWithFallback<HTMLElement>(SELECTORS.conversationTurn);
    if (turns.length === 0) {
      console.warn('[G2O] No Genspark conversation turns found with primary selectors');
      return [];
    }

    const messages: ConversationMessage[] = [];
    let userIdx = 0;
    let assistantIdx = 0;

    for (const turn of turns) {
      if (turn.classList.contains('user')) {
        const userEl = this.queryWithFallback<HTMLElement>(SELECTORS.userMessage, turn);
        const content = userEl?.textContent ? this.sanitizeText(userEl.textContent) : '';
        if (content) {
          messages.push({
            id: `user-${userIdx++}`,
            role: 'user',
            content,
            index: messages.length,
          });
        }
        continue;
      }

      if (turn.classList.contains('assistant')) {
        const assistantEl = this.queryWithFallback<HTMLElement>(SELECTORS.assistantMessage, turn);
        const content = assistantEl ? sanitizeHtml(assistantEl.innerHTML).trim() : '';
        if (content) {
          messages.push({
            id: `assistant-${assistantIdx++}`,
            role: 'assistant',
            content,
            htmlContent: content,
            index: messages.length,
          });
        }
      }
    }

    return messages;
  }
}
