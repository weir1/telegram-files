package telegram.files.repository;

import io.vertx.core.Future;

import java.util.List;

public interface SettingRepository {

    Future<Void> init();

    Future<SettingRecord> createOrUpdate(String key, String value);

    Future<List<SettingRecord>> getByKeys(List<String> keys);

    <T> Future<T> getByKey(SettingKey key);
}
