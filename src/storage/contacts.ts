import type { Chat } from '../types'

type StoredContact = Pick<Chat, 'id' | 'title' | 'phoneNumber' | 'avatar' | 'avatarTone'>
type ContactStorage = Pick<Storage, 'getItem' | 'setItem'>

function storageKey(idInstance: string) {
  return `green-api-telegram-contacts:${idInstance.trim()}`
}

export function loadContacts(idInstance: string, storage: ContactStorage = localStorage): Chat[] {
  const value = storage.getItem(storageKey(idInstance))
  if (!value) return []

  try {
    const contacts = JSON.parse(value) as StoredContact[]
    return contacts.map((contact) => ({
      ...contact,
      message: 'Нет сообщений',
      date: '',
    }))
  } catch {
    return []
  }
}

export function saveContacts(idInstance: string, chats: Chat[], storage: ContactStorage = localStorage) {
  const contacts: StoredContact[] = chats.map(({ id, title, phoneNumber, avatar, avatarTone }) => ({
    id,
    title,
    phoneNumber,
    avatar,
    avatarTone,
  }))

  storage.setItem(storageKey(idInstance), JSON.stringify(contacts))
}
