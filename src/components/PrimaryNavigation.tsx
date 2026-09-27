import chatIcon from '../assets/icons/chat.svg'
import folderIcon from '../assets/icons/folder.svg'
import logoutIcon from '../assets/icons/logout.svg'
import phoneIcon from '../assets/icons/phone.svg'
import settingsIcon from '../assets/icons/settings.svg'
import usersIcon from '../assets/icons/users.svg'

function NavigationIcon({ src }: { src: string }) {
  return <img alt="" className="icon" height="23" src={src} width="23" />
}

type NavigationItemProps = {
  icon: string
  label: string
  active?: boolean
  onClick?: () => void
  title?: string
}

function NavigationItem({ icon, label, active = false, onClick, title }: NavigationItemProps) {
  return (
    <button
      className={`nav-item${active ? ' nav-item--active' : ''}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span className="nav-item__icon"><NavigationIcon src={icon} /></span>
      <span>{label}</span>
    </button>
  )
}

export function PrimaryNavigation({ idInstance, onLogout }: { idInstance: string; onLogout: () => void }) {
  return (
    <nav className="primary-navigation" aria-label="Основная навигация">
      <div className="primary-navigation__top">
        <NavigationItem active icon={chatIcon} label="All" />
        <NavigationItem icon={folderIcon} label="New" />
        <NavigationItem icon={folderIcon} label="Channels" />
        <div className="nav-divider" />
        <NavigationItem icon={usersIcon} label="Contacts" />
        <NavigationItem icon={phoneIcon} label="Calls" />
      </div>
      <div className="primary-navigation__bottom">
        <NavigationItem icon={logoutIcon} label="Выйти" onClick={onLogout} title={`ID ${idInstance}`} />
        <NavigationItem icon={settingsIcon} label="Settings" />
      </div>
    </nav>
  )
}
