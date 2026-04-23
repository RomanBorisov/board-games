import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly title = signal('Durak Online');
  protected readonly backendMessage = signal('Loading...');

  ngOnInit(): void {
    this.http
      .get('http://localhost:8600/api/hello', { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.backendMessage.set(response);
        },
        error: (error) => {
          this.backendMessage.set(`Error: ${error.message ?? 'Unknown error'}`);
        },
      });
  }
}
