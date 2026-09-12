import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from './shell.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render header component', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('app-header');
    expect(header).not.toBeNull();
  });

  it('should render sidebar component', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const sidebar = fixture.nativeElement.querySelector('app-sidebar');
    expect(sidebar).not.toBeNull();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).not.toBeNull();
  });
});
