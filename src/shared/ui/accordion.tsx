import * as RadixAccordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@shared/lib/cn'

/** Disclosure built on Radix (keyboard + aria handled), styled with tokens. */
export function Accordion(props: ComponentPropsWithoutRef<typeof RadixAccordion.Root>) {
  return <RadixAccordion.Root {...props} />
}

export function AccordionItem({ className, ...props }: ComponentPropsWithoutRef<typeof RadixAccordion.Item>) {
  return <RadixAccordion.Item className={cn('border-b border-divider', className)} {...props} />
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        className={cn(
          'group flex flex-1 items-center justify-between gap-3 py-4 text-sm font-medium text-heading',
          'transition-colors hover:text-brand focus-visible:outline-none focus-visible:text-brand',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180" />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  )
}

export function AccordionContent({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixAccordion.Content>) {
  return (
    <RadixAccordion.Content className={cn('overflow-hidden text-sm text-body', className)} {...props}>
      <div className="pb-4">{children}</div>
    </RadixAccordion.Content>
  )
}
