package telegram.files.repository;

import io.vertx.core.Future;
import io.vertx.core.MultiMap;
import io.vertx.core.json.JsonObject;
import org.jooq.lambda.tuple.Tuple3;

import java.util.List;
import java.util.Map;

public interface FileRepository {
    Future<Void> init();

    Future<FileRecord> create(FileRecord fileRecord);

    Future<Map<Integer, FileRecord>> getFiles(long chatId, List<Integer> fileIds);

    Future<Tuple3<List<FileRecord>, Long, Long>> getFiles(long chatId, MultiMap filter);

    Future<Map<String, FileRecord>> getFilesByUniqueId(List<String> uniqueIds);

    Future<FileRecord> getByPrimaryKey(int fileId, String uniqueId);

    Future<FileRecord> getByUniqueId(String uniqueId);

    Future<JsonObject> getDownloadStatistics(long telegramId);

    Future<Integer> countByStatus(long telegramId, FileRecord.DownloadStatus downloadStatus);

    Future<JsonObject> updateStatus(int fileId,
                                    String uniqueId,
                                    String localPath,
                                    FileRecord.DownloadStatus downloadStatus);

    Future<Void> updateFileId(int fileId, String uniqueId);

    Future<Void> deleteByUniqueId(String uniqueId);

}
