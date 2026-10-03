import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import express from 'express'

const app = express()
app.get('/', (req,res) => res.send('Supernova Bot V6 - Pairing Code Ready - Check Logs'))
app.listen(process.env.PORT || 10000, () => console.log('Server ON'))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_new')
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Supernova", "Chrome", "1.0"]
  })
  sock.ev.on('creds.update', saveCreds)

  if(!state.creds.registered) {
    setTimeout(async () => {
      try {
        let pairingCode = await sock.requestPairingCode("213560668145")
        console.log('================================')
        console.log('PAIRING CODE: ' + pairingCode)
        console.log('PAIRING CODE: ' + pairingCode)
        console.log('Go to WhatsApp > Linked Devices > Link with phone number')
        console.log('================================')
      } catch(e) { 
        console.log('Error getting code:', e.message)
        console.log('Retrying in 5 sec...')
        setTimeout(() => startBot(), 5000)
      }
    }, 8000)
  }

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u
    if(connection === 'open') console.log('BOT CONNECTED 24/7!')
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed, reconnect:', shouldReconnect)
      if(shouldReconnect) setTimeout(startBot, 3000)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const from = m.key.remoteJid
    const txt = (m.message.conversation || m.message.extendedTextMessage?.text || "").toLowerCase()
    if(txt.includes('سلام') || txt.includes('مرحبا') || txt.includes('كتالوج')) {
      await sock.sendMessage(from, { text: '🌟 مرحبا بك في Supernova\n🛒 كتالوجنا: https://wa.me/c/213560668145' })
    }
  })
}
startBot()
