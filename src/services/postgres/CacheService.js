const redis = require('redis');

class CacheService {
  constructor() {
   this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      },
    });
    this._client.connect();
    this._client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  async set(key, value, expirationInSecond = 1800) {
    await this._client.set(key, value, { EX: expirationInSecond });
  }

  async get(key) {
    const result = await this._client.get(key);
    if (result === null) throw new Error('Cache not found');
    return result;
  }

  async delete(key) {
    await this._client.del(key);
  }
}

module.exports = CacheService;