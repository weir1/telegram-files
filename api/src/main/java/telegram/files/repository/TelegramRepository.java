package telegram.files.repository;

import io.vertx.core.Future;

import java.util.List;

public interface TelegramRepository {

    Future<Void> init();

    String getRootPath();

    Future<TelegramRecord> create(TelegramRecord telegramRecord);

    Future<TelegramRecord> getById(long id);

    Future<List<TelegramRecord>> getAll();
}
