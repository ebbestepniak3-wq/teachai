type ClassValue = string | undefined | null | false | ClassValue[]

function clsx(...inputs: ClassValue[]): string {
  return inputs.flat(Infinity).filter(Boolean).join(' ')
}

type VariantConfig = Record<string, Record<string, string>>

export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0]

export function cva(base: string, config?: { variants?: VariantConfig; defaultVariants?: Record<string, string>; compoundVariants?: any[] }) {
  return function(props?: Record<string, any>) {
    let classes = [base]
    if (config?.variants && props) {
      for (const [key, values] of Object.entries(config.variants)) {
        const value = props[key] ?? config.defaultVariants?.[key]
        if (value && values[value]) classes.push(values[value])
      }
    }
    return clsx(...classes)
  }
}
