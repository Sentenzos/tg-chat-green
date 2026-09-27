import plusIcon from '../assets/icons/plus.svg'
import searchIcon from '../assets/icons/search.svg'
import type { Chat } from '../types'
import { ChatAvatar } from './ChatAvatar'

type ChatListProps = {
  chats: Chat[]
  selectedChatId: string | null
  onAddChat: () => void
  onSelectChat: (chatId: string) => void
  receiveError: string
}

export function ChatList({ chats, selectedChatId, onAddChat, onSelectChat, receiveError }: ChatListProps) {
  return (
    <aside className="chat-list">
      <header className="chat-list__header">
        <h1>Chats</h1>
        <button className="add-chat-button" aria-label="Начать новый чат" onClick={onAddChat} type="button">
          <img alt="" className="icon" height="24" src={plusIcon} width="24" />
        </button>
      </header>
      <label className="search-field">
        <img alt="" className="icon" height="18" src={searchIcon} width="18" />
        <input aria-label="Поиск чатов" placeholder="Search" type="search" />
      </label>
      {receiveError && <div className="chat-list__warning" role="alert">{receiveError}</div>}
      <div className="chat-list__scroll">
        {chats.length === 0 && <div className="chat-list__state">Нажмите «+», чтобы добавить контакт</div>}
        {chats.map((chat) => (
          <button
            className={`chat-item${chat.id === selectedChatId ? ' chat-item--selected' : ''}`}
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            type="button"
          >
            <ChatAvatar chat={chat} />
            <span className="chat-item__content">
              <span className="chat-item__title-row">
                <span className="chat-item__title">{chat.title}</span>
                <span className="chat-item__date">{chat.date}</span>
              </span>
              <span className="chat-item__preview-row">
                <span className="chat-item__preview">
                  {chat.outgoing && <span className="message-status">✓</span>}
                  {chat.message}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
