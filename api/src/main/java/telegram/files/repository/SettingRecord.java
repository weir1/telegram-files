package telegram.files.repository;

import io.vertx.sqlclient.templates.RowMapper;
import io.vertx.sqlclient.templates.TupleMapper;

import java.util.Map;

public record SettingRecord(String key, String value) {

    public static final String SCHEME = """
            CREATE TABLE IF NOT EXISTS setting_record
            (
                key   VARCHAR(255) PRIMARY KEY,
                value TEXT
            )
            """;

    public static RowMapper<SettingRecord> ROW_MAPPER = row ->
            new SettingRecord(row.getString("key"),
                    row.getString("value")
            );

    public static TupleMapper<SettingRecord> PARAM_MAPPER = TupleMapper.mapper(r ->
            Map.ofEntries(Map.entry("key", r.key()),
                    Map.entry("value", r.value())
            ));
}
