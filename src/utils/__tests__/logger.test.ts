import { logger, LogLevel, type LogEntry } from '../logger';

describe('Logger Utility', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleGroupSpy: jest.SpyInstance;
  let consoleGroupEndSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
    consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
    logger.clearHistory();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  describe('Basic Logging', () => {
    test('should log info messages', () => {
      logger.info('Test info message', { userId: 'user123' });
      
      expect(consoleGroupSpy).toHaveBeenCalled();
      const logs = logger.getHistory();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('INFO');
      expect(logs[0].message).toBe('Test info message');
    });

    test('should log debug messages', () => {
      logger.debug('Test debug message', { debugData: '123' });
      
      expect(consoleGroupSpy).toHaveBeenCalled();
      const logs = logger.getHistory();
      expect(logs[0].level).toBe('DEBUG');
    });

    test('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(consoleGroupSpy).toHaveBeenCalled();
      const logs = logger.getHistory();
      expect(logs[0].level).toBe('WARN');
    });

    test('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      
      expect(consoleGroupSpy).toHaveBeenCalled();
      const logs = logger.getHistory();
      expect(logs[0].level).toBe('ERROR');
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.message).toBe('Test error');
    });
  });

  describe('Specialized Logging', () => {
    test('should log authentication events', () => {
      logger.logAuth('login', 'user123', { userEmail: 'user@example.com' });
      
      const logs = logger.getHistory();
      expect(logs[0].message).toContain('Auth Event');
      expect(logs[0].context?.userId).toBe('user123');
      expect(logs[0].context?.event).toBe('login');
    });

    test('should log Firebase operations', () => {
      logger.logFirebaseOperation('create', 'users', { documentId: 'doc123' });
      
      const logs = logger.getHistory();
      expect(logs[0].message).toContain('Firebase');
      expect(logs[0].context?.operation).toBe('create');
      expect(logs[0].context?.collection).toBe('users');
    });

    test('should log API requests', () => {
      logger.logApiRequest('POST', '/api/members', { body: { name: 'John' } });
      
      const logs = logger.getHistory();
      expect(logs[0].message).toContain('API Request');
      expect(logs[0].context?.method).toBe('POST');
      expect(logs[0].context?.endpoint).toBe('/api/members');
    });

    test('should log API responses', () => {
      logger.logApiResponse('GET', '/api/members', 200, 150);
      
      const logs = logger.getHistory();
      expect(logs[0].message).toContain('API Response');
      expect(logs[0].context?.status).toBe(200);
      expect(logs[0].context?.duration).toBe(150);
    });

    test('should log user actions', () => {
      logger.logAction('Create Member', 'user123', { memberName: 'John Doe' });
      
      const logs = logger.getHistory();
      expect(logs[0].message).toContain('User Action');
      expect(logs[0].context?.action).toBe('Create Member');
    });
  });

  describe('Performance Measurement', () => {
    test('should measure operation duration', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      };

      const result = await logger.measure('Test Operation', operation);
      
      expect(result).toBe('success');
      const logs = logger.getHistory();
      const perfLog = logs.find((log: LogEntry) => log.message.includes('Completed'));
      expect(perfLog).toBeDefined();
      expect(perfLog?.context?.duration).toBeGreaterThanOrEqual(90);
    });

    test('should handle errors in measured operations', async () => {
      const operation = async () => {
        throw new Error('Operation failed');
      };

      await expect(logger.measure('Failing Operation', operation)).rejects.toThrow('Operation failed');
      
      const logs = logger.getHistory();
      const errorLog = logs.find((log: LogEntry) => log.level === 'ERROR');
      expect(errorLog).toBeDefined();
      expect(errorLog?.message).toContain('Failed');
    });
  });

  describe('Log Management', () => {
    test('should retrieve all logs', () => {
      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3', new Error('Test'));
      
      const logs = logger.getHistory();
      expect(logs).toHaveLength(3);
    });

    test('should filter logs with getHistory limit', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      
      const logs = logger.getHistory(2);
      expect(logs).toHaveLength(2);
      expect(logs[1].message).toBe('Message 3');
    });

    test('should clear all logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      
      expect(logger.getHistory()).toHaveLength(2);
      
      logger.clearHistory();
      expect(logger.getHistory()).toHaveLength(0);
    });

    test('should limit log history to 1000 entries', () => {
      for (let i = 0; i < 1100; i++) {
        logger.info(`Message ${i}`);
      }
      
      const logs = logger.getHistory();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Export Functionality', () => {
    test('should export logs as JSON', () => {
      logger.info('Test message', { key: 'value' });
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].message).toBe('Test message');
      expect(parsed[0].context.key).toBe('value');
    });

    test('should handle empty log export', () => {
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toEqual([]);
    });
  });

  describe('Context Handling', () => {
    test('should include context in logs', () => {
      const context = {
        userId: 'user123',
        action: 'test',
        component: 'TestComponent',
      };
      
      logger.info('Test with context', context);
      
      const logs = logger.getHistory();
      expect(logs[0].context).toMatchObject(context);
    });

    test('should handle undefined context', () => {
      logger.info('Test without context');
      
      const logs = logger.getHistory();
      expect(logs[0].context).toBeUndefined();
    });

    test('should include error details in context', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      logger.error('Error occurred', error);
      
      const logs = logger.getHistory();
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.name).toBe('Error');
      expect(logs[0].error?.message).toBe('Test error');
      expect(logs[0].error?.stack).toBe('Error stack trace');
    });
  });

  describe('Timestamp Handling', () => {
    test('should include timestamp in logs', () => {
      const beforeLog = Date.now();
      logger.info('Test message');
      const afterLog = Date.now();
      
      const logs = logger.getHistory();
      const logTimestamp = new Date(logs[0].timestamp).getTime();
      
      expect(logTimestamp).toBeGreaterThanOrEqual(beforeLog);
      expect(logTimestamp).toBeLessThanOrEqual(afterLog + 1000); // 1 second tolerance
    });

    test('should have ISO format timestamps', () => {
      logger.info('Test message');
      
      const logs = logger.getHistory();
      const timestamp = logs[0].timestamp;
      
      // ISO format validation
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Log Level Configuration', () => {
    test('should respect log level settings', () => {
      logger.setLogLevel(LogLevel.WARN);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      
      const logs = logger.getHistory();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('WARN');
      
      // Reset to DEBUG for other tests
      logger.setLogLevel(LogLevel.DEBUG);
    });

    test('should disable console output', () => {
      logger.setConsoleEnabled(false);
      logger.info('Test message');
      
      expect(consoleGroupSpy).not.toHaveBeenCalled();
      
      // History should still be maintained
      const logs = logger.getHistory();
      expect(logs).toHaveLength(1);
      
      // Re-enable for other tests
      logger.setConsoleEnabled(true);
    });
  });
});
