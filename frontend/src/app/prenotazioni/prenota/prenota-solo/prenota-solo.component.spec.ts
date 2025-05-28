import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrenotaSoloComponent } from './prenota-solo.component';

describe('PrenotaSoloComponent', () => {
  let component: PrenotaSoloComponent;
  let fixture: ComponentFixture<PrenotaSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrenotaSoloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrenotaSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
