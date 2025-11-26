// /workspace-root/libs/app/src/lib/app.spec.ts

import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // FIX 1: Corrected array syntax and added an empty route array
      providers: [provideRouter([])]
    }).compileComponents();
  });

  // FIX 2: Moved 'it' inside the 'describe' block
  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
