import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksAdd } from './tasks-add';

describe('TasksAdd', () => {
  let component: TasksAdd;
  let fixture: ComponentFixture<TasksAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
