const noop = () => {};
// eslint-disable-next-line no-console
const log = (level: string, ..._arguments: unknown[]) => console.log(level, ..._arguments);

export enum LogLevel {
  NONE = 'none',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

const logLevelMap = {
  [LogLevel.NONE]: 100,
  [LogLevel.VERBOSE]: 5,
  [LogLevel.DEBUG]: 10,
  [LogLevel.INFO]: 20,
  [LogLevel.WARN]: 50,
  [LogLevel.ERROR]: 80,
} as const;

export let logger: {
  verbose: (..._arguments: unknown[]) => void;
  debug: (..._arguments: unknown[]) => void;
  info: (..._arguments: unknown[]) => void;
  warn: (..._arguments: unknown[]) => void;
  error: (..._arguments: unknown[]) => void;
} = {
  verbose: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

export function enableLogger(logLevel: LogLevel) {
  logger = {
    verbose:
      logLevelMap[logLevel] <= logLevelMap[LogLevel.VERBOSE] ? (..._arguments) => log('VERBOSE:', ..._arguments) : noop,
    debug:
      logLevelMap[logLevel] <= logLevelMap[LogLevel.DEBUG] ? (..._arguments) => log('DEBUG:', ..._arguments) : noop,
    info: logLevelMap[logLevel] <= logLevelMap[LogLevel.INFO] ? (..._arguments) => log('INFO:', ..._arguments) : noop,
    warn: logLevelMap[logLevel] <= logLevelMap[LogLevel.WARN] ? (..._arguments) => log('WARN:', ..._arguments) : noop,
    error:
      logLevelMap[logLevel] <= logLevelMap[LogLevel.ERROR] ? (..._arguments) => log('ERROR:', ..._arguments) : noop,
  };
}
