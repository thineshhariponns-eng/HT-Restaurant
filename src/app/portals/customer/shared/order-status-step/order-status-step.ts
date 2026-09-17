import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';

export type OrderStatusStepState = 'done' | 'current' | 'upcoming' | 'terminal';

@Component({
  selector: 'li[app-order-status-step]',
  imports: [DatePipe],
  templateUrl: './order-status-step.html',
  styleUrl: './order-status-step.css'
})
export class OrderStatusStep {
  readonly label = input.required<string>();
  readonly state = input.required<OrderStatusStepState>();
  readonly time = input<string | null>(null);
  /** Terminal steps use the "cancelled" glyph unless they represent a successful delivery/pickup end. */
  readonly terminalIsSuccess = input(false);
  readonly isLast = input(false);

  protected readonly srStateText = computed(() => {
    switch (this.state()) {
      case 'done':
        return 'Completed:';
      case 'current':
        return 'Current step:';
      case 'terminal':
        return 'Order stopped at:';
      default:
        return 'Not started:';
    }
  });

  protected readonly markerClasses = computed(() => {
    switch (this.state()) {
      case 'done':
        return 'border-primary-600 bg-primary-600';
      case 'current':
        return 'border-primary-600 bg-transparent';
      case 'terminal':
        return this.terminalIsSuccess()
          ? 'border-status-delivered bg-status-delivered'
          : 'border-status-cancelled bg-status-cancelled';
      default:
        return 'border-border-strong bg-transparent';
    }
  });

  protected readonly railClasses = computed(() =>
    this.state() === 'done' ? 'bg-primary-600' : 'border-t-2 border-dashed border-border-strong'
  );

  protected readonly labelClasses = computed(() =>
    this.state() === 'current' ? 'text-text-primary' : 'text-text-muted'
  );
}
