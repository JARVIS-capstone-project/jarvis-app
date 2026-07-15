import type { ReactNode } from 'react'
import { ArrowRight, Check, ChevronRight, Mail, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@shared/ui/button'
import type { ButtonSize, ButtonVariant } from '@shared/ui/button'
import { ItemButton } from '@shared/ui/item-button'
import { Input } from '@shared/ui/input'
import { Textarea } from '@shared/ui/textarea'
import type { FieldSize } from '@shared/ui/field-shell'
import { Badge } from '@shared/ui/badge'
import type { BadgeVariant } from '@shared/ui/badge'
import { Switch } from '@shared/ui/switch'
import { Card } from '@shared/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/accordion'
import { ChatSection } from '@modules/chat/ui/components/chat-section'
import { SessionHistory } from '@modules/chat/ui/components/session-history'
import { Sidebar } from '@app/layout/sidebar'

// ─────────────────────────────────────────────────────────────
// Registry powering the /design/component gallery.
// Add a new shared component by appending one ComponentDemo entry —
// the controls, live preview and code snippet are generated for you.
// See src/modules/design/CLAUDE.md for the full procedure.
// ─────────────────────────────────────────────────────────────

/** An editable prop: a union (select), free text, or a flag (boolean). */
export type Control =
  | { type: 'select'; prop: string; options: string[] }
  | { type: 'text'; prop: string; placeholder?: string }
  | { type: 'boolean'; prop: string }

/** Current value of every control for one demo. */
export type PropBag = Record<string, string | boolean>

export type ComponentDemo = {
  name: string
  description: string
  controls: Control[]
  defaultProps: PropBag
  /** Static inner text for the snippet; omit for self-closing tags (inputs). */
  children?: string
  /** Name of a text control whose live value is the inner text (editable label). */
  childrenProp?: string
  render: (props: PropBag) => ReactNode
}

const str = (v: string | boolean | undefined) => ((v as string) || undefined)

export const componentRegistry: ComponentDemo[] = [
  {
    name: 'Button',
    description: 'Primary interactive control. Variants map onto the brand/surface tokens.',
    controls: [
      { type: 'select', prop: 'variant', options: ['primary', 'secondary', 'ghost'] },
      { type: 'select', prop: 'size', options: ['sm', 'md', 'lg'] },
      { type: 'text', prop: 'label', placeholder: '(icon-only)' },
      { type: 'boolean', prop: 'isLoading' },
      { type: 'boolean', prop: 'leftIcon' },
      { type: 'boolean', prop: 'rightIcon' },
    ],
    defaultProps: { variant: 'primary', size: 'md', label: 'Button', isLoading: false, leftIcon: true, rightIcon: false },
    childrenProp: 'label',
    render: (p) => (
      <Button
        variant={p.variant as ButtonVariant}
        size={p.size as ButtonSize}
        isLoading={Boolean(p.isLoading)}
        leftIcon={p.leftIcon ? <Plus className="size-4" /> : undefined}
        rightIcon={p.rightIcon ? <ArrowRight className="size-4" /> : undefined}
        aria-label={p.label ? undefined : 'Add'}
      >
        {str(p.label)}
      </Button>
    ),
  },
  {
    name: 'ItemButton',
    description: 'Sidebar nav item. Active = brand fill; inactive rides on tokens (light/dark swap).',
    controls: [
      { type: 'text', prop: 'label', placeholder: '(icon-only)' },
      { type: 'boolean', prop: 'isActive' },
      { type: 'boolean', prop: 'collapsed' },
      { type: 'boolean', prop: 'leftIcon' },
      { type: 'boolean', prop: 'rightIcon' },
    ],
    defaultProps: { label: 'Chat', isActive: true, collapsed: false, leftIcon: true, rightIcon: false },
    childrenProp: 'label',
    render: (p) => (
      <div className="w-full max-w-xs">
        <ItemButton
          isActive={Boolean(p.isActive)}
          collapsed={Boolean(p.collapsed)}
          leftIcon={p.leftIcon ? <MessageSquare className="size-5" /> : undefined}
          rightIcon={p.rightIcon ? <ChevronRight className="size-5" /> : undefined}
          aria-label={p.label ? undefined : 'Chat'}
        >
          {str(p.label)}
        </ItemButton>
      </div>
    ),
  },
  {
    name: 'Input',
    description: 'Single-line field for password, email, search and info. Filled style.',
    controls: [
      { type: 'select', prop: 'type', options: ['text', 'password', 'email', 'search'] },
      { type: 'select', prop: 'size', options: ['sm', 'md', 'lg'] },
      { type: 'text', prop: 'label', placeholder: '(no label)' },
      { type: 'text', prop: 'placeholder' },
      { type: 'text', prop: 'error', placeholder: '(no error)' },
      { type: 'boolean', prop: 'leftIcon' },
    ],
    defaultProps: {
      type: 'text',
      size: 'md',
      label: 'Email',
      placeholder: 'you@example.com',
      error: '',
      leftIcon: false,
    },
    render: (p) => (
      <div className="w-full max-w-xs">
        <Input
          type={(p.type as string) || 'text'}
          size={p.size as FieldSize}
          label={str(p.label)}
          placeholder={str(p.placeholder)}
          error={str(p.error)}
          leftIcon={p.leftIcon ? <Mail className="size-4" /> : undefined}
        />
      </div>
    ),
  },
  {
    name: 'Textarea',
    description: 'Multi-line field with optional auto-grow for the chat composer.',
    controls: [
      { type: 'select', prop: 'size', options: ['sm', 'md', 'lg'] },
      { type: 'text', prop: 'label', placeholder: '(no label)' },
      { type: 'text', prop: 'placeholder' },
      { type: 'boolean', prop: 'autoGrow' },
    ],
    defaultProps: { size: 'md', label: '', placeholder: 'Message J.A.R.V.I.S…', autoGrow: true },
    render: (p) => (
      <div className="w-full max-w-md">
        <Textarea
          size={p.size as FieldSize}
          label={str(p.label)}
          placeholder={str(p.placeholder)}
          autoGrow={Boolean(p.autoGrow)}
        />
      </div>
    ),
  },
  {
    name: 'Badge',
    description: 'Status pills + type tags. Variants map onto the status / brand tokens.',
    controls: [
      { type: 'select', prop: 'variant', options: ['neutral', 'brand', 'success', 'danger', 'warning'] },
      { type: 'text', prop: 'label' },
      { type: 'boolean', prop: 'leftIcon' },
    ],
    defaultProps: { variant: 'success', label: 'Ingested', leftIcon: true },
    childrenProp: 'label',
    render: (p) => (
      <Badge variant={p.variant as BadgeVariant} leftIcon={p.leftIcon ? <Check className="size-3.5" /> : undefined}>
        {str(p.label)}
      </Badge>
    ),
  },
  {
    name: 'Switch',
    description: 'Toggle. Brand fill when on; controlled or uncontrolled. Drives dark mode.',
    controls: [
      { type: 'boolean', prop: 'defaultChecked' },
      { type: 'boolean', prop: 'disabled' },
    ],
    defaultProps: { defaultChecked: true, disabled: false },
    render: (p) => <Switch defaultChecked={Boolean(p.defaultChecked)} disabled={Boolean(p.disabled)} />,
  },
  {
    name: 'Card',
    description: 'Container surface — standardizes radius + border. Panel or surface tone.',
    controls: [{ type: 'boolean', prop: 'surface' }],
    defaultProps: { surface: false },
    render: (p) => (
      <Card surface={Boolean(p.surface)} className="w-full max-w-sm p-5">
        <h3 className="font-display text-lg text-heading">Card title</h3>
        <p className="mt-1 text-sm text-muted">Composable surface; callers add their own padding.</p>
      </Card>
    ),
  },
  {
    name: 'ChatSection',
    description:
      'Full chat pane — welcome hero swaps for the message list on first send. Feature component (not a shared primitive); shares the global chat store, so messages typed here also show up on /new.',
    controls: [],
    defaultProps: {},
    render: () => (
      <div className="h-150 w-full">
        <ChatSection />
      </div>
    ),
  },
  {
    name: 'Sidebar',
    description:
      'App shell left rail — brand header, Features nav (Chat/Workspace), SessionHistory slot, Settings + Darkmode. Clicking Chat routes to /new; Darkmode switch is live and drives the whole app theme.',
    controls: [],
    defaultProps: {},
    render: () => (
      <div className="h-150 overflow-hidden rounded-2xl border border-divider">
        <Sidebar />
      </div>
    ),
  },
  {
    name: 'SessionHistory',
    description:
      'Recent chat threads list — rendered inside Sidebar. Mock data until the sessions API lands; sort icon is a placeholder.',
    controls: [],
    defaultProps: {},
    render: () => (
      <div className="w-72 rounded-2xl border border-divider bg-panel p-4">
        <SessionHistory />
      </div>
    ),
  },
  {
    name: 'Accordion',
    description: 'Disclosure (Radix). Keyboard + aria handled; styled with tokens.',
    controls: [],
    defaultProps: {},
    render: () => (
      <div className="w-full max-w-md">
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger>Authentication resolve for user</AccordionTrigger>
            <AccordionContent>Last modified DD/MM/YY · Size XX MB. Expanded detail goes here.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Payment service docs</AccordionTrigger>
            <AccordionContent>Document rows and import dropzone would render here.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
]
