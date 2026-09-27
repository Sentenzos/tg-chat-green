import { describe, expect, it } from 'vitest'
import type { Chat } from '../types'
import { loadContacts, saveContacts } from './contacts'

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

const contact: Chat = {
  id: '12345',
  title: 'Test User',
  phoneNumber: '79991234567',
  avatar: 'TU',
  avatarTone: 'blue',
  message: 'Сообщение не должно сохраниться',
  date: '12:30',
  outgoing: true,
}

describe('contacts storage', () => {
  it('stores contacts separately for each instance without messages', () => {
    const storage = createStorage()

    saveContacts('instance-1', [contact], storage)

    expect(loadContacts('instance-1', storage)).toEqual([{
      id: '12345',
      title: 'Test User',
      phoneNumber: '79991234567',
      avatar: 'TU',
      avatarTone: 'blue',
      message: 'Нет сообщений',
      date: '',
    }])
    expect(loadContacts('instance-2', storage)).toEqual([])
  })

  it('ignores broken stored data', () => {
    const storage = createStorage()
    storage.setItem('green-api-telegram-contacts:instance-1', 'not json')

    expect(loadContacts('instance-1', storage)).toEqual([])
  })
})
