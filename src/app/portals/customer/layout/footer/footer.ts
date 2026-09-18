import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESTAURANT_CONTACT } from '../../data/restaurant-info';

interface FooterLink {
  label: string;
  path: string;
}

interface SocialLink {
  label: string;
  href: string;
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();
  protected readonly contact = RESTAURANT_CONTACT;

  protected readonly quickLinks: FooterLink[] = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  protected readonly hours = [
    { day: 'Monday – Friday', time: '11:00 AM – 10:30 PM' },
    { day: 'Saturday – Sunday', time: '10:30 AM – 11:00 PM' }
  ];

  /** Placeholder handles until real social accounts are confirmed. */
  protected readonly socialLinks: SocialLink[] = [
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'WhatsApp', href: '#' }
  ];
}
