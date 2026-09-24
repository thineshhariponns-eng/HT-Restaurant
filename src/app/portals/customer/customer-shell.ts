import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { LoginPrompt } from './shared/login-prompt/login-prompt';

@Component({
  selector: 'app-customer-shell',
  imports: [RouterOutlet, Header, Footer, LoginPrompt],
  templateUrl: './customer-shell.html',
  styleUrl: './customer-shell.css'
})
export class CustomerShell {}
