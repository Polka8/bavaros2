import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneMenuComponent } from './gestione-menu.component';

describe('GestioneMenuComponent', () => {
  let component: GestioneMenuComponent;
  let fixture: ComponentFixture<GestioneMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestioneMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestioneMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
