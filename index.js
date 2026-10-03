import pkg from '@whiskeysockets/baileys'
const makeWASocket = pkg.default
const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = pkg
import pino from 'pino'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req,res) => res.send('Supernova Bot V5 is Running 24/7 - 750h FREE - Live!'))
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const CATALOG_LINK = "https://wa.me/c/213560668145"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: { 
      creds: state.creds, 
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) 
    },
    browser: ["Supernova Bot", "Chrome", "1.0"]
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if(shouldReconnect) {
        console.log('Reconnecting...')
        startBot()
      }
    } else if(connection === 'open') {
      console.log('✅ Bot connected! 24/7 on Render - 750h FREE')
    }
  })
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return
    const from = msg.key.remoteJid
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    if (text.includes('سلام') || text.includes('مرحبا')) {
      await sock.sendMessage(from, { text: `وعليكم السلام 🌟\nأهلاً بكم في وكالة Supernova\n\n📋 خدماتنا:\n• بوت PRO: 9,500 دج\n• متجر: 11,000 دج\n• صفحة هبوط: 5,000 دج\n\n🛒 كتالوجنا:\n${CATALOG_LINK}` })
    } else if (text.includes('كتالوج')) {
      await sock.sendMessage(from, { text: `🛒 كتالوج Supernova\n${CATALOG_LINK}` })
    }
  })
}
startBot()
