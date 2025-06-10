import Dexie, { type Table } from 'dexie'
import type { ChatSession, Message } from '~/stores/main'

// Define database schema
export interface DexieChatSession extends Omit<ChatSession, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
}

export interface DexieMessage extends Omit<Message, 'timestamp'> {
  timestamp: string
  sessionId: string
}

export interface DexieAttachment {
  id: string
  messageId: string
  type: 'image' | 'document' | 'code'
  name: string
  size: number
  content?: string
  url?: string
  createdAt: string
}

// Create Dexie database class
class CyberChatDatabase extends Dexie {
  sessions!: Table<DexieChatSession>
  messages!: Table<DexieMessage>
  attachments!: Table<DexieAttachment>
  
  constructor() {
    super('CyberChatDB')
    
    this.version(1).stores({
      sessions: 'id, title, createdAt, updatedAt, archived, shared',
      messages: 'id, sessionId, role, timestamp',
      attachments: 'id, messageId, type, createdAt'
    })
  }
}

// Initialize database
const db = new CyberChatDatabase()

export const useDexie = () => {
  const mainStore = useMainStore()
  
  // Session operations
  const saveSession = async (session: ChatSession) => {
    try {
      const dexieSession: DexieChatSession = {
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      }
      
      await db.sessions.put(dexieSession)
      
      // Save messages separately
      const messages = session.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
        sessionId: session.id
      }))
      
      await db.messages.bulkPut(messages)
    } catch (error) {
      console.error('Failed to save session to Dexie:', error)
      throw error
    }
  }
  
  const loadSessions = async (): Promise<ChatSession[]> => {
    try {
      const dexieSessions = await db.sessions.toArray()
      
      const sessions: ChatSession[] = await Promise.all(
        dexieSessions.map(async (dexieSession) => {
          const messages = await db.messages
            .where('sessionId')
            .equals(dexieSession.id)
            .toArray()
          
          return {
            ...dexieSession,
            createdAt: new Date(dexieSession.createdAt),
            updatedAt: new Date(dexieSession.updatedAt),
            messages: messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }
        })
      )
      
      return sessions.sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      )
    } catch (error) {
      console.error('Failed to load sessions from Dexie:', error)
      return []
    }
  }
  
  const deleteSession = async (sessionId: string) => {
    try {
      await db.transaction('rw', db.sessions, db.messages, db.attachments, async () => {
        await db.sessions.delete(sessionId)
        await db.messages.where('sessionId').equals(sessionId).delete()
        
        // Delete related attachments
        const messageIds = await db.messages
          .where('sessionId')
          .equals(sessionId)
          .primaryKeys()
        
        for (const messageId of messageIds) {
          await db.attachments.where('messageId').equals(messageId).delete()
        }
      })
    } catch (error) {
      console.error('Failed to delete session from Dexie:', error)
      throw error
    }
  }
  
  // Message operations
  const saveMessage = async (message: Message, sessionId: string) => {
    try {
      const dexieMessage: DexieMessage = {
        ...message,
        timestamp: message.timestamp.toISOString(),
        sessionId
      }
      
      await db.messages.put(dexieMessage)
      
      // Update session's updatedAt
      await db.sessions.update(sessionId, {
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to save message to Dexie:', error)
      throw error
    }
  }
  
  const updateMessage = async (messageId: string, updates: Partial<Message>) => {
    try {
      const updatesWithTimestamp = {
        ...updates,
        timestamp: updates.timestamp?.toISOString()
      }
      
      await db.messages.update(messageId, updatesWithTimestamp)
    } catch (error) {
      console.error('Failed to update message in Dexie:', error)
      throw error
    }
  }
  
  // Attachment operations
  const saveAttachment = async (attachment: DexieAttachment) => {
    try {
      await db.attachments.put(attachment)
    } catch (error) {
      console.error('Failed to save attachment to Dexie:', error)
      throw error
    }
  }
  
  const getAttachments = async (messageId: string) => {
    try {
      return await db.attachments
        .where('messageId')
        .equals(messageId)
        .toArray()
    } catch (error) {
      console.error('Failed to get attachments from Dexie:', error)
      return []
    }
  }
  
  // Search operations
  const searchSessions = async (query: string): Promise<ChatSession[]> => {
    try {
      const lowercaseQuery = query.toLowerCase()
      
      // Search in session titles
      const titleMatches = await db.sessions
        .filter(session => 
          session.title.toLowerCase().includes(lowercaseQuery)
        )
        .toArray()
      
      // Search in messages
      const messageMatches = await db.messages
        .filter(message => 
          message.content.toLowerCase().includes(lowercaseQuery)
        )
        .toArray()
      
      const sessionIds = new Set([
        ...titleMatches.map(s => s.id),
        ...messageMatches.map(m => m.sessionId)
      ])
      
      const sessions: ChatSession[] = []
      
      for (const sessionId of sessionIds) {
        const session = await db.sessions.get(sessionId)
        if (session) {
          const messages = await db.messages
            .where('sessionId')
            .equals(sessionId)
            .toArray()
          
          sessions.push({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          })
        }
      }
      
      return sessions.sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      )
    } catch (error) {
      console.error('Failed to search sessions in Dexie:', error)
      return []
    }
  }
  
  // Sync operations
  const syncWithStore = async () => {
    try {
      const sessions = await loadSessions()
      mainStore.chatSessions = sessions
      
      // Set current chat if not set
      if (!mainStore.currentChatId && sessions.length > 0) {
        mainStore.currentChatId = sessions[0].id
      }
    } catch (error) {
      console.error('Failed to sync with store:', error)
    }
  }
  
  const clearAllData = async () => {
    try {
      await db.transaction('rw', db.sessions, db.messages, db.attachments, async () => {
        await db.sessions.clear()
        await db.messages.clear()
        await db.attachments.clear()
      })
    } catch (error) {
      console.error('Failed to clear Dexie data:', error)
      throw error
    }
  }
  
  // Export data
  const exportData = async () => {
    try {
      const sessions = await db.sessions.toArray()
      const messages = await db.messages.toArray()
      const attachments = await db.attachments.toArray()
      
      return {
        version: 1,
        exportDate: new Date().toISOString(),
        sessions,
        messages,
        attachments
      }
    } catch (error) {
      console.error('Failed to export data from Dexie:', error)
      throw error
    }
  }
  
  // Import data
  const importData = async (data: any) => {
    try {
      if (data.version !== 1) {
        throw new Error('Unsupported data version')
      }
      
      await db.transaction('rw', db.sessions, db.messages, db.attachments, async () => {
        // Clear existing data
        await db.sessions.clear()
        await db.messages.clear()
        await db.attachments.clear()
        
        // Import new data
        await db.sessions.bulkPut(data.sessions)
        await db.messages.bulkPut(data.messages)
        await db.attachments.bulkPut(data.attachments)
      })
      
      // Sync with store
      await syncWithStore()
    } catch (error) {
      console.error('Failed to import data to Dexie:', error)
      throw error
    }
  }
  
  return {
    db,
    saveSession,
    loadSessions,
    deleteSession,
    saveMessage,
    updateMessage,
    saveAttachment,
    getAttachments,
    searchSessions,
    syncWithStore,
    clearAllData,
    exportData,
    importData
  }
}