import { ReactElement } from 'react'

export interface MenuItem {
  name: string
  icon?: ReactElement
  link?: string
  dropdownItems?: { name: string; link: string }[]
}
