export type Credentials = {
  idInstance: string
  apiTokenInstance: string
}

export type ContactInput = {
  phoneNumber: string
  firstName: string
  lastName: string
}

export type Chat = {
  id: string
  title: string
  phoneNumber: string
  avatar: string
  avatarTone: 'blue' | 'green' | 'orange' | 'purple' | 'pink'
  message: string
  date: string
  outgoing?: boolean
}

export type Message = {
  id: string
  chatId: string
  text: string
  timestamp: number
  type: 'incoming' | 'outgoing'
}

export type IncomingMessage = {
  chatId: string
  message: Message
}
