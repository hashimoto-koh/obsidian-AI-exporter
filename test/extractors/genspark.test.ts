import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GensparkExtractor } from '../../src/content/extractors/genspark';
import {
  loadFixture,
  clearFixture,
  resetLocation,
  setGensparkLocation,
  setNonGensparkLocation,
  createGensparkPage,
} from '../fixtures/dom-helpers';

describe('GensparkExtractor', () => {
  let extractor: GensparkExtractor;

  beforeEach(() => {
    extractor = new GensparkExtractor();
    clearFixture();
  });

  afterEach(() => {
    clearFixture();
    resetLocation();
    document.title = '';
  });

  describe('Platform Detection', () => {
    it('identifies as genspark platform', () => {
      expect(extractor.platform).toBe('genspark');
    });

    it('returns true for www.genspark.ai agents pages', () => {
      setGensparkLocation();
      expect(extractor.canExtract()).toBe(true);
    });

    it('returns true for genspark.ai agents pages', () => {
      setGensparkLocation('674b196e-7ed3-408d-bb5e-5180741703b7', 'genspark.ai');
      expect(extractor.canExtract()).toBe(true);
    });

    it('returns false for non-agents paths', () => {
      setNonGensparkLocation('www.genspark.ai', '/blog/post');
      expect(extractor.canExtract()).toBe(false);
    });

    it('returns false for other domains', () => {
      setNonGensparkLocation('chatgpt.com', '/agents?id=test');
      expect(extractor.canExtract()).toBe(false);
    });
  });

  describe('Conversation ID Extraction', () => {
    it('extracts UUID from agents query parameter', () => {
      setGensparkLocation('674b196e-7ed3-408d-bb5e-5180741703b7');
      expect(extractor.getConversationId()).toBe('674b196e-7ed3-408d-bb5e-5180741703b7');
    });

    it('returns null when id query parameter is missing', () => {
      setNonGensparkLocation('www.genspark.ai', '/agents');
      expect(extractor.getConversationId()).toBeNull();
    });
  });

  describe('Title Extraction', () => {
    it('returns h1 text when present', () => {
      setGensparkLocation();
      loadFixture(createGensparkPage('What is the difference?', '<p>Body</p>'));
      document.title = 'GeminiとCopilotのCLI対VSCode拡張機能比較';

      expect(extractor.getTitle()).toBe('What is the difference?');
    });

    it('falls back to document.title when no user message exists', () => {
      setGensparkLocation();
      loadFixture('<div class="general-chat-wrapper"><div class="chat-wrapper"></div></div>');
      document.title = 'GeminiとCopilotのCLI対VSCode拡張機能比較';

      expect(extractor.getTitle()).toBe('GeminiとCopilotのCLI対VSCode拡張機能比較');
    });

    it('returns default title when no heading or page title exists', () => {
      setGensparkLocation();
      loadFixture('<div class="general-chat-wrapper"><div class="chat-wrapper"></div></div>');
      document.title = 'Genspark';

      expect(extractor.getTitle()).toBe('Untitled Genspark Conversation');
    });
  });

  describe('Message Extraction', () => {
    it('extracts user and assistant messages from chat DOM', () => {
      setGensparkLocation();
      loadFixture(createGensparkPage('Hello Genspark', '<p>Introduction</p><ul><li>First</li></ul>'));

      const messages = extractor.extractMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello Genspark');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toContain('<p>Introduction</p>');
      expect(messages[1].content).toContain('<ul>');
    });

    it('returns empty array when no conversation turns are found', () => {
      setGensparkLocation();
      loadFixture('<div>Empty page</div>');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const messages = extractor.extractMessages();

      expect(messages).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No Genspark conversation turns found')
      );
      warnSpy.mockRestore();
    });
  });

  describe('Full Extraction', () => {
    it('returns success with chat messages', async () => {
      setGensparkLocation();
      loadFixture(createGensparkPage('Question', '<p>Generated answer</p>'));
      document.title = 'GeminiとCopilotのCLI対VSCode拡張機能比較';

      const result = await extractor.extract();

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('genspark');
      expect(result.data?.messages).toHaveLength(2);
      expect(result.data?.title).toBe('Question');
    });

    it('returns failure when not on a Genspark agents page', async () => {
      resetLocation();

      const result = await extractor.extract();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not on a Genspark page');
    });
  });
});
