import type { Chat } from '../types'

export function ChatAvatar({ chat }: { chat: Chat }) {
  return <span className={`chat-avatar chat-avatar--${chat.avatarTone}`}>{chat.avatar}</span>
}
