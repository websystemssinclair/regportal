export const RegPortalPreset = {
  button: {
    root: ({ props }) => ({
      class: [
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        {
          'bg-[#ac1a2f] text-white hover:bg-[#871523] focus-visible:ring-[#ac1a2f] px-4 py-2':
            props.severity === undefined || props.severity === 'primary',
          'bg-transparent border border-[#ac1a2f] text-[#ac1a2f] hover:bg-[#ac1a2f]/5 focus-visible:ring-[#ac1a2f] px-4 py-2':
            props.outlined,
          'opacity-60 cursor-not-allowed': props.disabled,
        },
      ],
    }),
    label: 'font-medium',
  },
  inputtext: {
    root: 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac1a2f] focus:border-transparent',
  },
  select: {
    root: 'relative w-full',
    input: 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac1a2f]',
    overlay: 'absolute z-50 bg-white border border-gray-200 rounded shadow-lg mt-1',
    option: ({ context }) => ({
      class: [
        'px-3 py-2 text-sm cursor-pointer',
        {
          'bg-[#ac1a2f] text-white': context.selected,
          'hover:bg-gray-100': !context.selected,
        },
      ],
    }),
  },
}
