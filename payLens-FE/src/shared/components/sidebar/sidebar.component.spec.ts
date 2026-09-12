import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all five navigation links', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.app-sidebar__link');
    expect(links.length).toBe(5);
  });

  it('should include a link to /dashboard', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const links: HTMLAnchorElement[] =
      fixture.nativeElement.querySelectorAll('.app-sidebar__link');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
  });

  it('should include a link to /employees', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const links: HTMLAnchorElement[] =
      fixture.nativeElement.querySelectorAll('.app-sidebar__link');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/employees');
  });

  it('should include a link to /compensation', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const links: HTMLAnchorElement[] =
      fixture.nativeElement.querySelectorAll('.app-sidebar__link');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/compensation');
  });

  it('should include a link to /analytics', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const links: HTMLAnchorElement[] =
      fixture.nativeElement.querySelectorAll('.app-sidebar__link');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/analytics');
  });

  it('should include a link to /ask', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const links: HTMLAnchorElement[] =
      fixture.nativeElement.querySelectorAll('.app-sidebar__link');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/ask');
  });

  it('should have a nav element with aria-label', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');
  });
});
