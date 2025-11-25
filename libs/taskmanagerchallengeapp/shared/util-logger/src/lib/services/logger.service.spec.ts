import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
    service = TestBed.inject(LoggerService);

    jest.spyOn(console, 'log').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log messages', () => {
    service.log('test message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
  });
});
