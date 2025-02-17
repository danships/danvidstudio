/* eslint-disable no-console */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enableLogger, logger, LogLevel } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('default state', () => {
    it('should have all logging methods as noop by default', () => {
      logger.verbose('test');
      logger.debug('test');
      logger.info('test');
      logger.warn('test');
      logger.error('test');

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('enableLogger', () => {
    it('should enable all levels for VERBOSE', () => {
      enableLogger(LogLevel.VERBOSE);

      logger.verbose('test verbose');
      logger.debug('test debug');
      logger.info('test info');
      logger.warn('test warn');
      logger.error('test error');

      expect(console.log).toHaveBeenCalledTimes(5);
      expect(console.log).toHaveBeenNthCalledWith(1, 'VERBOSE:', 'test verbose');
      expect(console.log).toHaveBeenNthCalledWith(2, 'DEBUG:', 'test debug');
      expect(console.log).toHaveBeenNthCalledWith(3, 'INFO:', 'test info');
      expect(console.log).toHaveBeenNthCalledWith(4, 'WARN:', 'test warn');
      expect(console.log).toHaveBeenNthCalledWith(5, 'ERROR:', 'test error');
    });

    it('should enable only ERROR level for ERROR', () => {
      enableLogger(LogLevel.ERROR);

      logger.verbose('test verbose');
      logger.debug('test debug');
      logger.info('test info');
      logger.warn('test warn');
      logger.error('test error');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('ERROR:', 'test error');
    });

    it('should disable all logging for NONE', () => {
      enableLogger(LogLevel.NONE);

      logger.verbose('test verbose');
      logger.debug('test debug');
      logger.info('test info');
      logger.warn('test warn');
      logger.error('test error');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      enableLogger(LogLevel.INFO);

      logger.info('test', 123, { key: 'value' });

      expect(console.log).toHaveBeenCalledWith('INFO:', 'test', 123, { key: 'value' });
    });
  });
});
