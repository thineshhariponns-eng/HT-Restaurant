import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('Admin shell', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('opens on the orders queue', async () => {
    const harness = await RouterTestingHarness.create('/');
    const el = harness.fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toContain('Orders');
  });

  it('lists every admin section in the sidebar', async () => {
    const harness = await RouterTestingHarness.create('/orders');
    const links = Array.from(
      (harness.fixture.nativeElement as HTMLElement).querySelectorAll('nav[aria-label="Admin"] a'),
    ).map((a) => a.textContent?.trim().replace(/\s+\d+$/, ''));

    expect(links).toEqual(['Dashboard', 'Orders', 'Menu', 'Staff', 'Customers', 'Reports']);
  });
});
