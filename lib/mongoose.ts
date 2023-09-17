import mongoose from 'mongoose'

let isConnected = false

export const connectToDB = async () => {
  mongoose.set('strictQuery', true)

  if (!process.env.MONGODB_URL) { console.log('=> No database URL provided'); return }
  if (isConnected) { console.log('=> Already connected to database'); return }

  try {
    console.log('process.env.MONGODB_URL', process.env.MONGODB_URL)
    await mongoose.connect(process.env.MONGODB_URL)
    isConnected = true
    console.log('=> Connected to database')
  } catch (error) {
    console.log('=> Error connecting to database: ', error)
  }
}
