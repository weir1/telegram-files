package telegram.files.repository;

import cn.hutool.core.lang.Version;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.Future;
import io.vertx.sqlclient.SqlClient;

import java.util.TreeMap;
import java.util.stream.Stream;

public interface Definition {

    Log log = LogFactory.get();

    String getScheme();

    default TreeMap<Version, String[]> getMigrations() {
        return new TreeMap<>();
    }

    default Future<Void> createTable(SqlClient sqlClient) {
        return sqlClient
                .query(getScheme())
                .execute()
                .onFailure(err -> log.error("Failed to create table: %s".formatted(err.getMessage())))
                .mapEmpty();
    }

    default Future<Void> migrate(SqlClient sqlClient, Version lastVersion, Version currentVersion) {
        TreeMap<Version, String[]> migrations = getMigrations();
        if (migrations.isEmpty()) {
            return Future.succeededFuture();
        }
        return Future.all(migrations.subMap(lastVersion, false, currentVersion, true).values()
                        .stream()
                        .flatMap(arr -> Stream.of(arr)
                                .map(sql -> sqlClient.query(sql)
                                        .execute()
                                        .onFailure(e -> log.error("Failed to apply migration: %s".formatted(sql), e)))
                        )
                        .toList()
                )
                .onFailure(err -> log.error("Failed to migrate table: %s".formatted(err.getMessage())))
                .mapEmpty();
    }
}
