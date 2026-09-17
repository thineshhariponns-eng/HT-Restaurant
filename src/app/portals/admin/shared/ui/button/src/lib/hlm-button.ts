import { Directive, input, signal } from '@angular/core';
import { BrnButton } from '@spartan-ng/brain/button';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ClassValue } from 'clsx';
import { injectBrnButtonConfig } from './hlm-button.token';

export const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive dark:data-[matches-spartan-invalid=true]:border-destructive/50 rounded-none border border-transparent bg-clip-padding text-sm font-semibold focus-visible:ring-1 active:not-aria-[haspopup]:translate-y-px data-[matches-spartan-invalid=true]:ring-1 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
  {
    variants: {
      variant: {
        // Daily Card: turmeric fill lightens on hover; nothing darkens, nothing casts a shadow.
        default: 'bg-primary text-primary-foreground hover:bg-primary-700',
        outline:
          'border-border-strong bg-transparent text-foreground hover:border-primary hover:text-primary aria-expanded:border-primary aria-expanded:text-primary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-primary',
        ghost:
          'text-text-body hover:bg-accent hover:text-primary aria-expanded:bg-accent aria-expanded:text-primary',
        // A rust fill fails AA on ink, so destructive actions are a rust outline.
        destructive:
          'border-error bg-transparent text-error-text hover:bg-error-100 focus-visible:outline-error',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2',
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
        sm: "h-8 gap-1 rounded-none px-2.5 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3.5)]",
        lg: 'h-10 gap-2 px-5 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3',
        icon: 'size-9',
        'icon-xs':
          "size-6 rounded-none [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
        'icon-sm': 'size-8 rounded-none',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
  selector: 'button[hlmBtn], a[hlmBtn]',
  exportAs: 'hlmBtn',
  hostDirectives: [{ directive: BrnButton, inputs: ['disabled'] }],
  host: { 'data-slot': 'button' },
})
export class HlmButton {
  private readonly _config = injectBrnButtonConfig();

  private readonly _additionalClasses = signal<ClassValue>('');

  public readonly variant = input<ButtonVariants['variant']>(this._config.variant);

  public readonly size = input<ButtonVariants['size']>(this._config.size);

  constructor() {
    classes(() => [
      buttonVariants({ variant: this.variant(), size: this.size() }),
      this._additionalClasses(),
    ]);
  }

  setClass(classes: string): void {
    this._additionalClasses.set(classes);
  }
}
