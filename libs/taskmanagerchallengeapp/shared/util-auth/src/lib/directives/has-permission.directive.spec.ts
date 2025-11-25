import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HasPermissionDirective } from './has-permission.directive';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';

@Component({
  template: `<div *appHasPermission="'create:tasks'">Authorized Content</div>`,
  imports: [HasPermissionDirective],
  standalone: true
})
class TestComponent { }

describe('HasPermissionDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let mockUserPermissions: WritableSignal<string[]>;

  beforeEach(async () => {
    mockUserPermissions = signal([]);

    const authServiceMock = {
      userPermissions: mockUserPermissions
    };

    const loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
  });

  it('should NOT show content if user lacks permission', () => {
    mockUserPermissions.set([]);

    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('div');
    expect(element).toBeNull();
  });

  it('should show content if user has permission', () => {
    mockUserPermissions.set(['create:tasks']);

    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('div');
    expect(element).not.toBeNull();
    expect(element.textContent).toBe('Authorized Content');
  });
});
