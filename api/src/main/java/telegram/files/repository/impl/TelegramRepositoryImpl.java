package telegram.files.repository.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.map.MapUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.Future;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.templates.SqlTemplate;
import telegram.files.Config;
import telegram.files.repository.TelegramRecord;
import telegram.files.repository.TelegramRepository;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class TelegramRepositoryImpl implements TelegramRepository {

    private static final Log log = LogFactory.get();

    private final JDBCPool pool;

    public TelegramRepositoryImpl(JDBCPool pool) {
        this.pool = pool;
    }

    @Override
    public Future<Void> init() {
        return pool.getConnection()
                .compose(conn -> conn
                        .query(TelegramRecord.SCHEME)
                        .execute()
                        .onComplete(r -> conn.close())
                        .onFailure(err -> log.error("Failed to create table telegram_record: %s".formatted(err.getMessage())))
                        .onSuccess(ps -> log.trace("Successfully created table: telegram_record"))
                )
                .mapEmpty();
    }

    @Override
    public String getRootPath() {
        return Config.TELEGRAM_ROOT + File.separator + UUID.randomUUID();
    }

    @Override
    public Future<TelegramRecord> create(TelegramRecord telegramRecord) {
        return SqlTemplate
                .forUpdate(pool, "INSERT INTO telegram_record(id, first_name, root_path, proxy) VALUES (#{id}, #{first_name}, #{root_path}, #{proxy})")
                .mapFrom(TelegramRecord.PARAM_MAPPER)
                .execute(telegramRecord)
                .map(r -> telegramRecord)
                .onSuccess(r -> log.trace("Successfully created telegram record: %s".formatted(telegramRecord.id())))
                .onFailure(
                        err -> log.error("Failed to create telegram record: %s".formatted(err.getMessage()))
                );
    }

    @Override
    public Future<TelegramRecord> update(TelegramRecord telegramRecord) {
        return SqlTemplate
                .forUpdate(pool, "UPDATE telegram_record SET first_name = #{first_name}, root_path = #{root_path}, proxy = #{proxy} WHERE id = #{id}")
                .mapFrom(TelegramRecord.PARAM_MAPPER)
                .execute(telegramRecord)
                .map(r -> telegramRecord)
                .onSuccess(r -> log.debug("Successfully updated telegram record: %s".formatted(telegramRecord.id())))
                .onFailure(
                        err -> log.error("Failed to update telegram record: %s".formatted(err.getMessage()))
                );
    }

    @Override
    public Future<TelegramRecord> getById(long id) {
        return SqlTemplate
                .forQuery(pool, "SELECT * FROM telegram_record WHERE id = #{id} limit 1")
                .mapTo(TelegramRecord.ROW_MAPPER)
                .execute(MapUtil.of("id", id))
                .map(rs -> rs.size() == 0 ? null : rs.iterator().next());
    }

    @Override
    public Future<List<TelegramRecord>> getAll() {
        return SqlTemplate
                .forQuery(pool, "SELECT * FROM telegram_record ORDER BY id")
                .mapTo(TelegramRecord.ROW_MAPPER)
                .execute(Collections.emptyMap())
                .map(CollUtil::newArrayList);
    }
}
