package telegram.files.repository;

import cn.hutool.core.map.MapUtil;
import io.vertx.sqlclient.templates.RowMapper;
import io.vertx.sqlclient.templates.TupleMapper;

public record TelegramRecord(
        long id,
        String firstName,
        String rootPath,
        String proxy
) {

    public static final String SCHEME = """
            CREATE TABLE IF NOT EXISTS telegram_record
            (
                id         BIGINT PRIMARY KEY,
                first_name VARCHAR(255),
                root_path  VARCHAR(255),
                proxy      VARCHAR(255)
            )
            """;

    public static RowMapper<TelegramRecord> ROW_MAPPER = row ->
            new TelegramRecord(row.getLong("id"),
                    row.getString("first_name"),
                    row.getString("root_path"),
                    row.getString("proxy")
            );

    public static TupleMapper<TelegramRecord> PARAM_MAPPER = TupleMapper.mapper(r ->
            MapUtil.ofEntries(MapUtil.entry("id", r.id),
                    MapUtil.entry("first_name", r.firstName()),
                    MapUtil.entry("root_path", r.rootPath()),
                    MapUtil.entry("proxy", r.proxy())
            ));

    public TelegramRecord withProxy(String proxy) {
        return new TelegramRecord(id, firstName, rootPath, proxy);
    }
}
