interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

