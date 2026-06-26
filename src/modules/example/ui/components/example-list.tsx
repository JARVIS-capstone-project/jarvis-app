import type { Example } from '@modules/example/logic/models/example'

interface ExampleListProps {
  items: Example[]
}

export function ExampleList({ items }: ExampleListProps) {
  if (items.length === 0) {
    return <p className="text-gray-500">No examples yet.</p>
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between px-4 py-3">
          <span>{item.title}</span>
          <span className={item.completed ? 'text-green-600' : 'text-gray-400'}>
            {item.completed ? 'Done' : 'Pending'}
          </span>
        </li>
      ))}
    </ul>
  )
}
