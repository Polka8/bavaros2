import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreaPiattoComponent } from './crea-piatto.component';

describe('CreaPiattoComponent', () => {
  let component: CreaPiattoComponent;
  let fixture: ComponentFixture<CreaPiattoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreaPiattoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreaPiattoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
