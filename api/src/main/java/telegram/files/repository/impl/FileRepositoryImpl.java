package telegram.files.repository.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.collection.IterUtil;
import cn.hutool.core.convert.Convert;
import cn.hutool.core.map.MapUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.Future;
import io.vertx.core.MultiMap;
import io.vertx.core.json.JsonObject;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.templates.SqlTemplate;
import org.jooq.lambda.tuple.Tuple;
import org.jooq.lambda.tuple.Tuple3;
import telegram.files.repository.FileRecord;
import telegram.files.repository.FileRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class FileRepositoryImpl implements FileRepository {

    private static final Log log = LogFactory.get();

    private final JDBCPool pool;

    public FileRepositoryImpl(JDBCPool pool) {
        this.pool = pool;
    }

    @Override
    public Future<Void> init() {
        return pool.getConnection()
                .compose(conn -> conn
                        .query(FileRecord.SCHEME)
                        .execute()
                        .onComplete(r -> conn.close())
                        .onFailure(err -> log.error("Failed to create table file_record: %s".formatted(err.getMessage())))
                        .onSuccess(ps -> log.debug("Successfully created table: file_record"))
                )
                .mapEmpty();
    }

    @Override
    public Future<FileRecord> create(FileRecord fileRecord) {
        return SqlTemplate
                .forUpdate(pool, """
                        INSERT INTO file_record(id, unique_id, telegram_id, chat_id, message_id, date, has_sensitive_content, size, downloaded_size,
                                                type, mime_type,
                                                file_name, thumbnail, caption, local_path,
                                                download_status)
                        values (#{id}, #{unique_id}, #{telegram_id}, #{chat_id}, #{message_id}, #{date}, #{has_sensitive_content}, #{size}, #{downloaded_size}, #{type},
                                #{mime_type}, #{file_name}, #{thumbnail}, #{caption}, #{local_path}, #{download_status})
                        """)
                .mapFrom(FileRecord.PARAM_MAPPER)
                .execute(fileRecord)
                .map(r -> fileRecord)
                .onSuccess(r -> log.debug("Successfully created file record: %s".formatted(fileRecord.id()))
                )
                .onFailure(
                        err -> log.error("Failed to create file record: %s".formatted(err.getMessage()))
                );
    }

    @Override
    public Future<Map<Integer, FileRecord>> getFiles(long chatId, List<Integer> fileIds) {
        if (CollUtil.isEmpty(fileIds)) {
            return Future.succeededFuture(new HashMap<>());
        }
        return SqlTemplate
                .forQuery(pool, """
                        SELECT * FROM file_record WHERE chat_id = #{chatId} AND id IN (#{fileIds})
                        """)
                .mapTo(FileRecord.ROW_MAPPER)
                .execute(Map.of("chatId", chatId, "fileIds", StrUtil.join(",", fileIds)))
                .onFailure(err -> log.error("Failed to get file record: %s".formatted(err.getMessage())))
                .map(rs -> {
                    Map<Integer, FileRecord> map = new HashMap<>();
                    for (FileRecord record : rs) {
                        map.put(record.id(), record);
                    }
                    return map;
                });
    }

    @Override
    public Future<Tuple3<List<FileRecord>, Long, Long>> getFiles(long chatId, MultiMap filter) {
        String status = filter.get("status");
        String search = filter.get("search");
        Long fromMessageId = Convert.toLong(filter.get("fromMessageId"), 0L);
        String type = filter.get("type");

        String whereClause = "chat_id = #{chatId}";
        Map<String, Object> params = MapUtil.of("chatId", chatId);
        if (StrUtil.isNotBlank(status)) {
            whereClause += " AND download_status = #{status}";
            params.put("status", status);
        }
        if (StrUtil.isNotBlank(search)) {
            whereClause += " AND (file_name LIKE #{search} OR caption LIKE #{search})";
            params.put("search", "%%" + search + "%%");
        }
        if (fromMessageId > 0) {
            whereClause += " AND message_id > #{fromMessageId}";
            params.put("fromMessageId", fromMessageId);
        }
        if (StrUtil.isNotBlank(type)) {
            if (Objects.equals(type, "media")) {
                whereClause += " AND type IN ('photo', 'video')";
            } else {
                whereClause += " AND type = #{type}";
                params.put("type", type);
            }
        }
        return Future.all(
                SqlTemplate
                        .forQuery(pool, """
                                SELECT * FROM file_record WHERE %s ORDER BY date DESC
                                """.formatted(whereClause))
                        .mapTo(FileRecord.ROW_MAPPER)
                        .execute(params)
                        .onFailure(err -> log.error("Failed to get file record: %s".formatted(err.getMessage())))
                        .map(IterUtil::toList)
                ,
                SqlTemplate
                        .forQuery(pool, """
                                SELECT COUNT(*) FROM file_record WHERE %s
                                """.formatted(whereClause))
                        .mapTo(rs -> rs.getLong(0))
                        .execute(params)
                        .onFailure(err -> log.error("Failed to get file record count: %s".formatted(err.getMessage())))
                        .map(rs -> rs.size() > 0 ? rs.iterator().next() : 0L)
        ).map(r -> {
            List<FileRecord> fileRecords = r.resultAt(0);
            long nextFromMessageId = CollUtil.isEmpty(fileRecords) ? 0 : fileRecords.getLast().messageId();
            return Tuple.tuple(fileRecords, nextFromMessageId, r.resultAt(1));
        });
    }

    @Override
    public Future<Map<String, FileRecord>> getFilesByUniqueId(List<String> uniqueIds) {
        uniqueIds = uniqueIds.stream()
                .filter(StrUtil::isNotBlank)
                .distinct().collect(Collectors.toList());
        if (CollUtil.isEmpty(uniqueIds)) {
            return Future.succeededFuture(new HashMap<>());
        }
        String uniqueIdPlaceholders = IntStream.range(0, uniqueIds.size())
                .mapToObj(i -> "#{uniqueId" + i + "}")
                .collect(Collectors.joining(","));
        Map<String, Object> params = new HashMap<>();
        for (int i = 0; i < uniqueIds.size(); i++) {
            params.put("uniqueId" + i, uniqueIds.get(i));
        }
        return SqlTemplate
                .forQuery(pool, """
                        SELECT * FROM file_record WHERE unique_id IN (%s)
                        """.formatted(uniqueIdPlaceholders))
                .mapTo(FileRecord.ROW_MAPPER)
                .execute(params)
                .onFailure(err -> log.error("Failed to get file record: %s".formatted(err.getMessage())))
                .map(rs -> {
                    Map<String, FileRecord> map = new HashMap<>();
                    for (FileRecord record : rs) {
                        map.put(record.uniqueId(), record);
                    }
                    return map;
                });
    }

    @Override
    public Future<FileRecord> getByPrimaryKey(int fileId, String uniqueId) {
        return SqlTemplate
                .forQuery(pool, """
                        SELECT * FROM file_record WHERE id = #{fileId} AND unique_id = #{uniqueId}
                        """)
                .mapTo(FileRecord.ROW_MAPPER)
                .execute(Map.of("fileId", fileId, "uniqueId", uniqueId))
                .onFailure(err -> log.error("Failed to get file record: %s".formatted(err.getMessage()))
                )
                .map(rs -> rs.size() > 0 ? rs.iterator().next() : null);
    }

    @Override
    public Future<FileRecord> getByUniqueId(String uniqueId) {
        return SqlTemplate
                .forQuery(pool, """
                        SELECT * FROM file_record WHERE unique_id = #{uniqueId} LIMIT 1
                        """)
                .mapTo(FileRecord.ROW_MAPPER)
                .execute(Map.of("uniqueId", uniqueId))
                .onFailure(err -> log.error("Failed to get file record: %s".formatted(err.getMessage()))
                )
                .map(rs -> rs.size() > 0 ? rs.iterator().next() : null);
    }

    @Override
    public Future<JsonObject> getDownloadStatistics(long telegramId) {
        return SqlTemplate
                .forQuery(pool, """
                        SELECT COUNT(*)                                                    AS total,
                               COUNT(CASE WHEN download_status = 'downloading' THEN 1 END) AS downloading,
                               COUNT(CASE WHEN download_status = 'paused' THEN 1 END)      AS paused,
                               COUNT(CASE WHEN download_status = 'completed' THEN 1 END)   AS completed,
                               COUNT(CASE WHEN download_status = 'error' THEN 1 END)       AS error,
                               COUNT(CASE WHEN type = 'photo' THEN 1 END)                  AS photo,
                               COUNT(CASE WHEN type = 'video' THEN 1 END)                  AS video,
                               COUNT(CASE WHEN type = 'audio' THEN 1 END)                  AS audio,
                               COUNT(CASE WHEN type = 'file' THEN 1 END)                   AS file
                        FROM file_record
                        WHERE telegram_id = #{telegramId}
                        """)
                .mapTo(row -> {
                    JsonObject result = JsonObject.of();
                    result.put("total", row.getInteger("total"));
                    result.put("downloading", row.getInteger("downloading"));
                    result.put("paused", row.getInteger("paused"));
                    result.put("completed", row.getInteger("completed"));
                    result.put("error", row.getInteger("error"));
                    result.put("photo", row.getInteger("photo"));
                    result.put("video", row.getInteger("video"));
                    result.put("audio", row.getInteger("audio"));
                    result.put("file", row.getInteger("file"));
                    return result;
                })
                .execute(Map.of("telegramId", telegramId))
                .map(rs -> rs.size() > 0 ? rs.iterator().next() : JsonObject.of())
                .onFailure(err -> log.error("Failed to get download statistics: %s".formatted(err.getMessage())));
    }

    @Override
    public Future<JsonObject> updateStatus(int fileId, String uniqueId, String localPath, FileRecord.DownloadStatus downloadStatus) {
        if (StrUtil.isBlank(localPath) && downloadStatus == null) {
            return Future.succeededFuture(null);
        }
        return getByUniqueId(uniqueId)
                .compose(record -> {
                    if (record == null) {
                        return Future.succeededFuture(null);
                    }
                    boolean pathUpdated = !Objects.equals(record.localPath(), localPath);
                    boolean downloadStatusUpdated = !Objects.equals(record.downloadStatus(), downloadStatus.name());
                    if (!pathUpdated && !downloadStatusUpdated) {
                        return Future.succeededFuture(null);
                    }

                    return SqlTemplate
                            .forUpdate(pool, """
                                    UPDATE file_record SET local_path = #{localPath}, download_status = #{downloadStatus}
                                    WHERE id = #{fileId} AND unique_id = #{uniqueId}
                                    """)
                            .execute(MapUtil.ofEntries(MapUtil.entry("fileId", fileId),
                                    MapUtil.entry("uniqueId", uniqueId),
                                    MapUtil.entry("localPath", pathUpdated ? localPath : record.localPath()),
                                    MapUtil.entry("downloadStatus", downloadStatusUpdated ? downloadStatus.name() : record.downloadStatus())
                            ))
                            .onFailure(err ->
                                    log.error("Failed to update file record: %s".formatted(err.getMessage()))
                            )
                            .map(r -> {
                                JsonObject result = JsonObject.of();
                                if (pathUpdated) {
                                    result.put("localPath", localPath);
                                }
                                if (downloadStatusUpdated) {
                                    result.put("downloadStatus", downloadStatus.name());
                                }
                                log.debug("Successfully updated file record: %s, path: %s, status: %s, before: %s, %s"
                                        .formatted(fileId, localPath, downloadStatus.name(), record.localPath(), record.downloadStatus()));
                                return result;
                            });
                });
    }

    @Override
    public Future<Void> updateFileId(int fileId, String uniqueId) {
        if (fileId <= 0 || StrUtil.isBlank(uniqueId)) {
            return Future.succeededFuture();
        }
        return this.getByUniqueId(uniqueId)
                .compose(record -> {
                    if (record == null || record.id() == fileId) {
                        return Future.succeededFuture();
                    }
                    return SqlTemplate
                            .forUpdate(pool, """
                                    UPDATE file_record SET id = #{fileId} WHERE unique_id = #{uniqueId}
                                    """)
                            .execute(Map.of("fileId", fileId, "uniqueId", uniqueId))
                            .onFailure(err ->
                                    log.error("Failed to update file record: %s".formatted(err.getMessage()))
                            )
                            .mapEmpty();
                });
    }
}
