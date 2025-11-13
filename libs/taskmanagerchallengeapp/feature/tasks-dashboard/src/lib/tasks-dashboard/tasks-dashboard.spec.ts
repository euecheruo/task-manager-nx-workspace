import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksDashboard } from './tasks-dashboard';

describe('TasksDashboard', () => {
  let component: TasksDashboard;
  let fixture: ComponentFixture<TasksDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
