const mapSongDBToModel = ({
  id,  title, year, performer, genre, duration, album_id,
}) => ({
  id, title, year, performer, genre, duration, albumId: album_id,
});

const mapAlbumDBToModel = ({
  id, name, year, cover,
}) => ({
  id, name, year, coverUrl: cover,
});

const mapUserDBToModel = ({
  id, username, fullname,
}) => ({
  id, username, fullname,
});

const mapGetPlaylistDBToModel = ({
id, name, username,
}) => ({
  id, name, username,
});

const mapGetPlaylistActivitiesDBToModel = ({
  username, title, action, time,
}) => ({
  username, title, action, time,
});

const mapSongSummaryDBToModel = ({ id, title, performer }) => ({
  id,
  title,
  performer,
});

module.exports = {
  mapAlbumDBToModel, mapSongDBToModel, mapUserDBToModel, mapGetPlaylistDBToModel, mapGetPlaylistActivitiesDBToModel, mapSongSummaryDBToModel
};