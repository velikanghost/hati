import { MenuItem } from '@/lib/types'
import { useState } from 'react'
import {
  RiArrowDropDownLine,
  RiArrowDropRightLine,
  RiCloseLine,
} from 'react-icons/ri'

interface SidebarProps {
  menuItems: MenuItem[]
  setShowSidebar: (value: boolean) => void
}
export const MobileSidebar = ({ menuItems, setShowSidebar }: SidebarProps) => {
  const closeSidebar = (event: any) => {
    if (event.target.id === 'closeSidebar') setShowSidebar(false)
  }

  return (
    <div
      className="custom-sidebar__overlay"
      onClick={(event) => closeSidebar(event)}
      id="closeSidebar"
    >
      <div className="custom-sidebar">
        <div className="top-area">
          <button
            className="menu-icon-button ml-auto text-teal"
            onClick={() => {
              setShowSidebar(false)
            }}
          >
            <RiCloseLine size={32} className="z-50" />
          </button>
        </div>
        <div className="menu-items">
          {menuItems.map((item, i) => (
            <MobileSidebarItem item={item} key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface SidebarItemProps {
  item: MenuItem
}
export const MobileSidebarItem = ({ item }: SidebarItemProps) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  return (
    <>
      {item.dropdownItems ? (
        <div className={`item ${item.dropdownItems && 'dropdown'}`}>
          <div
            className="dropdown-head"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{item.name}</span>
            {showDropdown ? <RiArrowDropDownLine /> : <RiArrowDropRightLine />}
          </div>
          {showDropdown && (
            <div className="menu-items">
              {item.dropdownItems.map((item, i) => (
                <MobileSidebarItem item={item} key={i} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <a href={item.link} className={`item `}>
          <span className="flex gap-2 items-center">
            {item.icon} {item.name}
          </span>
        </a>
      )}
    </>
  )
}
