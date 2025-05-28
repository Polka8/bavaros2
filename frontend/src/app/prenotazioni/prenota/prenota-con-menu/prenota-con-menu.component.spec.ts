import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrenotaConMenuComponent } from './prenota-con-menu.component';

describe('PrenotaConMenuComponent', () => {
  let component: PrenotaConMenuComponent;
  let fixture: ComponentFixture<PrenotaConMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrenotaConMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrenotaConMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
