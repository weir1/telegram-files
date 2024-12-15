package telegram.files.repository;

import cn.hutool.core.map.MapUtil;
import io.vertx.sqlclient.templates.RowMapper;
import io.vertx.sqlclient.templates.TupleMapper;

import java.util.Map;

public record TelegramRecord(long id, String firstName, String rootPath) {

    public static final String SCHEME = """
            CREATE TABLE IF NOT EXISTS telegram_record
            (
                id         BIGINT PRIMARY KEY,
                first_name VARCHAR(255),
                root_path  VARCHAR(255)
            )
            """;

    public static RowMapper<TelegramRecord> ROW_MAPPER = row ->
            new TelegramRecord(row.getLong("id"),
                    row.getString("first_name"),
                    row.getString("root_path")
            );

    public static TupleMapper<TelegramRecord> PARAM_MAPPER = TupleMapper.mapper(r ->
            Map.ofEntries(MapUtil.entry("id", r.id),
                    Map.entry("first_name", r.firstName()),
                    Map.entry("root_path", r.rootPath())
            ));
}
