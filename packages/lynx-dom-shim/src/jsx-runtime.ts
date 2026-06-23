import React from 'react'

const TAG_MAP: Record<string, keyof React.JSX.IntrinsicElements> = {
  view: 'div',
  text: 'span',
  image: 'img',
  'scroll-view': 'div',
}

function mapProps(type: string, props: Record<string, unknown> | null) {
  if (!props) return {}
  const { bindtap, className, style, children, 'scroll-y': scrollY, ...rest } = props as Record<string, unknown> & {
    bindtap?: () => void
    className?: string
    style?: React.CSSProperties
    'scroll-y'?: boolean | string
  }

  const mapped: Record<string, unknown> = {
    ...rest,
    className,
    style: {
      ...(typeof style === 'object' && style ? style : {}),
      ...(type === 'scroll-view' || scrollY
        ? { overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const }
        : {}),
    },
  }

  if (bindtap) mapped.onClick = bindtap
  return mapped
}

function createElement(type: string, props: Record<string, unknown> | null, ...children: React.ReactNode[]) {
  const Tag = TAG_MAP[type] ?? type
  const mapped = mapProps(type, props)
  return React.createElement(Tag, mapped, ...children)
}

export function jsx(type: string, props: Record<string, unknown>, key?: string) {
  void key
  const { children } = props ?? {}
  return createElement(type, props, children as React.ReactNode)
}

export function jsxs(type: string, props: Record<string, unknown>, key?: string) {
  void key
  const { children } = props ?? {}
  const childArray = Array.isArray(children) ? children : [children]
  return createElement(type, props, ...childArray)
}

export { Fragment } from 'react'
