// app.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subject, BehaviorSubject, EMPTY, Observable } from 'rxjs';
import {
  takeUntil,
  switchMap,
  map,
  scan,
  startWith,
  distinctUntilChanged,
} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stopwatch-container">
      <h1>Simple Stopwatch</h1>

      <div class="timer-display" (click)="toggleTimer()">
        {{ formattedTime$ | async }}
      </div>

      <div class="buttons">
        <button
          class="btn btn-start"
          (click)="start()"
          [disabled]="isRunning$ | async"
        >
          Start
        </button>
        <button
          class="btn btn-stop"
          (click)="stop()"
          [disabled]="!(isRunning$ | async)"
        >
          Stop
        </button>
        <button class="btn btn-reset" (click)="reset()">Reset</button>
      </div>

      <div class="status">
        Status: {{ (isRunning$ | async) ? 'Running' : 'Stopped' }}
      </div>
    </div>
  `,
  styles: [
    `
      .stopwatch-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      h1 {
        margin-bottom: 2rem;
        font-size: 2.5rem;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }

      .timer-display {
        font-size: 4rem;
        font-weight: bold;
        background: rgba(255, 255, 255, 0.1);
        padding: 1rem 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.2);
      }

      .timer-display:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      .buttons {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .btn {
        padding: 12px 24px;
        font-size: 1.1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: bold;
        min-width: 100px;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }

      .btn:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .btn-start {
        background: #4caf50;
        color: white;
      }

      .btn-stop {
        background: #f44336;
        color: white;
      }

      .btn-reset {
        background: #ff9800;
        color: white;
      }

      .status {
        font-size: 1.2rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        backdrop-filter: blur(10px);
      }
    `,
  ],
})
export class AppComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private _isRunning$ = new BehaviorSubject<boolean>(false);
  private reset$ = new Subject<void>();

  private tick$: Observable<number> = this._isRunning$.pipe(
    distinctUntilChanged(),
    switchMap((isRunning) => (isRunning ? interval(10) : EMPTY))
  );

  public elapsedTime$ = this.reset$.pipe(
    startWith(null), // Start immediately
    switchMap(() =>
      this.tick$.pipe(
        scan((acc) => acc + 10, 0),
        startWith(0)
      )
    ),
    takeUntil(this.destroy$)
  );

  // Format time for display
  public formattedTime$ = this.elapsedTime$.pipe(
    map((time) => this.formatTime(time))
  );

  start(): void {
    this._isRunning$.next(true);
  }

  stop(): void {
    this._isRunning$.next(false);
  }

  reset(): void {
    this._isRunning$.next(false);
    this.reset$.next();
  }

  toggleTimer(): void {
    const currentState = this._isRunning$.value;
    this._isRunning$.next(!currentState);
  }

  private formatTime(milliseconds: number): string {
    const totalMs = Math.floor(milliseconds);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Expose isRunning$ as public for template
  get isRunning$() {
    return this._isRunning$.asObservable();
  }
}
