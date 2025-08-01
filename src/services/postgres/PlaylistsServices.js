const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/invariantError');
const NotFoundError = require('../../exceptions/notFoundError');
const AuthorizationError = require('../../exceptions/authorizationError');

class PlaylistsService {
  constructor(collaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    const query = {
      text: `
        SELECT p.id, p.name, u.username
        FROM playlists p
        JOIN users u ON p.owner = u.id
        WHERE p.owner = $1
        UNION
        SELECT p.id, p.name, u.username
        FROM collaborations c
        JOIN playlists p ON c.playlist_id = p.id
        JOIN users u ON p.owner = u.id
        WHERE c.user_id = $1
      `,
      values: [userId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistById(playlistId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifySong(songId) {
    const query = {
      text: 'SELECT id FROM songs WHERE id = $1',
      values: [songId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Songs tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `song_playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES ($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Musik gagal ditambahkan ke dalam playlist');
    }
  }

  async getSongsFromPlaylist(playlistId) {
    const playlistQuery = {
      text: `
        SELECT playlists.id, playlists.name, users.username
        FROM playlists
        JOIN users ON playlists.owner = users.id
        WHERE playlists.id = $1
      `,
      values: [playlistId],
    };
  
    const playlistResult = await this._pool.query(playlistQuery);
    if (!playlistResult.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const songQuery = {
      text: `
        SELECT songs.id, songs.title, songs.performer
        FROM playlist_songs
        JOIN songs ON songs.id = playlist_songs.song_id
        WHERE playlist_songs.playlist_id = $1
      `,
      values: [playlistId],
    };

    const songsResult = await this._pool.query(songQuery);

    return {
      ...playlistResult.rows[0],
      songs: songsResult.rows,
    };
  }


  async getPlaylistSongsById(playlistId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId);

    const playlistQuery = {
      text: `
        SELECT p.id, p.name, u.username
        FROM playlists p
        JOIN users u ON p.owner = u.id
        WHERE p.id = $1
      `,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(playlistQuery);
    if (!playlistResult.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const songsQuery = {
      text: `
        SELECT s.id, s.title, s.performer
        FROM songs s
        JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id = $1
      `,
      values: [playlistId],
    };

    const songsResult = await this._pool.query(songsQuery);

    return {
      ...playlistResult.rows[0],
      songs: songsResult.rows,
    };
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: `
        DELETE FROM playlist_songs
        WHERE playlist_id = $1 AND song_id = $2
        RETURNING id
      `,
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Musik gagal dihapus dari playlist');
    }
  }

  async getPlaylistActivitiesById(playlistId) {
    await this.getPlaylistById(playlistId);

    const query = {
      text: `
        SELECT u.username, s.title, a.action, a.time
        FROM playlist_song_activities a
        JOIN songs s ON a.song_id = s.id
        JOIN users u ON a.user_id = u.id
        WHERE a.playlist_id = $1
        ORDER BY a.time ASC
      `,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async addActivity(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();
    const query = {
      text: `
        INSERT INTO playlist_song_activities
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      values: [id, playlistId, songId, userId, action, time],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Gagal menambahkan activity');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
