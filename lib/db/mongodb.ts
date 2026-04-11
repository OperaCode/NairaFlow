import { MongoClient } from 'mongodb'

const options = {}
let prodClientPromise: Promise<MongoClient> | undefined

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function getClientPromise() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  }

  if (!prodClientPromise) {
    const client = new MongoClient(uri, options)
    prodClientPromise = client.connect()
  }

  return prodClientPromise
}

export async function getDb() {
  const mongoClient = await getClientPromise()
  return mongoClient.db(process.env.MONGODB_DB_NAME || 'nairaflow')
}
