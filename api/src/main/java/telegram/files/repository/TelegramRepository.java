package telegram.files.repository;

import io.vertx.core.Future;

import java.util.List;

public interface TelegramRepository {
    String getRootPath();

    Future<TelegramRecord> create(TelegramRecord telegramRecord);

    Future<TelegramRecord> update(TelegramRecord telegramRecord);

    Future<TelegramRecord> getById(long id);

    Future<List<TelegramRecord>> getAll();
}
