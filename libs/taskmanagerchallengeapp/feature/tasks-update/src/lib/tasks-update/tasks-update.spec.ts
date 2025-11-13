import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksUpdate } from './tasks-update';

describe('TasksUpdate', () => {
  let component: TasksUpdate;
  let fixture: ComponentFixture<TasksUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
