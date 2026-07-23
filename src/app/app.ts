import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BottomNav } from './shared/bottom-nav/bottom-nav';
import { Header } from './shared/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, BottomNav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('meat-meet');
}
