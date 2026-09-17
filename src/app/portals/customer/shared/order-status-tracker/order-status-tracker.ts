import { Component, computed, input } from '@angular/core';
import { STATUS_COPY, STEPS_BY_TYPE, StatusEvent, TrackedStatus } from '../../data/order-data';
import type { OrderType } from '../order-type-selector/order-type-selector';
import { OrderStatusStep, OrderStatusStepState } from '../order-status-step/order-status-step';

interface StepView {
  status: TrackedStatus;
  label: string;
  time: string | null;
  state: OrderStatusStepState;
  terminalIsSuccess: boolean;
}

@Component({
  selector: 'app-order-status-tracker',
  imports: [OrderStatusStep],
  templateUrl: './order-status-tracker.html',
  styleUrl: './order-status-tracker.css'
})
export class OrderStatusTracker {
  readonly type = input.required<OrderType>();
  readonly status = input.required<TrackedStatus>();
  readonly history = input.required<StatusEvent[]>();

  protected readonly steps = computed<StepView[]>(() => {
    const status = this.status();
    const history = this.history();
    const type = this.type();

    // A cancelled order shows only where it began and where it stopped — no fulfilment steps.
    if (status === 'cancelled') {
      const cancelledAt = history.find((event) => event.status === 'cancelled')?.at ?? null;
      return [
        { status: 'pending', label: 'Order Created', time: history[0]?.at ?? null, state: 'done', terminalIsSuccess: false },
        { status: 'cancelled', label: STATUS_COPY[type].cancelled.label, time: cancelledAt, state: 'terminal', terminalIsSuccess: false }
      ];
    }

    if (status === 'rejected') {
      return history.map((event, index) => ({
        status: event.status,
        label: STATUS_COPY[type][event.status].label,
        time: event.at,
        state: index === history.length - 1 ? 'terminal' : 'done',
        terminalIsSuccess: false
      }));
    }

    const path = STEPS_BY_TYPE[type];
    const currentIndex = path.indexOf(status);

    return path.map((stepStatus, index) => {
      const event = history.find((h) => h.status === stepStatus);
      const isFinalStep = index === path.length - 1;
      let state: OrderStatusStepState;
      if (index < currentIndex) {
        state = 'done';
      } else if (index === currentIndex) {
        state = isFinalStep ? 'terminal' : 'current';
      } else {
        state = 'upcoming';
      }
      return {
        status: stepStatus,
        label: STATUS_COPY[type][stepStatus].label,
        time: event?.at ?? null,
        state,
        terminalIsSuccess: isFinalStep
      };
    });
  });
}
