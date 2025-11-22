// /workspace-root/libs/app/shared/util-auth/lib/directives/has-permission.directive.spec.ts

import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HasPermissionDirective } from './has-permission.directive';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';

// 1. Define Test Component
@Component({
  template: `<div *appHasPermission="'create:tasks'">Authorized Content</div>`,
  imports: [HasPermissionDirective], // Fix: Import the directive here
  standalone: true
})
class TestComponent { }

describe('HasPermissionDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  // Fix: Type as string[] because permissions are usually a list
  let mockUserPermissions: WritableSignal<string[]>;

  beforeEach(async () => {
    // Fix: Initialize with empty array to prevent undefined errors
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
      imports: [TestComponent], // Import the standalone test component
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
  });

  it('should NOT show content if user lacks permission', () => {
    // Arrange
    mockUserPermissions.set([]); // User has no permissions

    // Act
    fixture.detectChanges(); // Trigger change detection/directive update

    // Assert
    const element = fixture.nativeElement.querySelector('div');
    expect(element).toBeNull();
  });

  it('should show content if user has permission', () => {
    // Arrange
    mockUserPermissions.set(['create:tasks']); // User has required permission

    // Act
    fixture.detectChanges();

    // Assert
    const element = fixture.nativeElement.querySelector('div');
    expect(element).not.toBeNull();
    expect(element.textContent).toBe('Authorized Content');
  });
});
