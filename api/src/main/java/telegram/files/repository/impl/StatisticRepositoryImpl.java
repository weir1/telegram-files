package telegram.files.repository.impl;

import cn.hutool.core.collection.IterUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.Future;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.templates.SqlTemplate;
import telegram.files.repository.StatisticRecord;
import telegram.files.repository.StatisticRepository;

import java.util.List;
import java.util.Map;

public class StatisticRepositoryImpl implements StatisticRepository {

    private static final Log log = LogFactory.get();

    private final JDBCPool pool;

    public StatisticRepositoryImpl(JDBCPool pool) {
        this.pool = pool;
    }

    @Override
    public Future<Void> create(StatisticRecord record) {
        return SqlTemplate
                .forUpdate(pool, """
                        INSERT INTO statistic_record(related_id, type, timestamp, data)
                        VALUES (#{related_id}, #{type}, #{timestamp}, #{data})
                        """)
                .mapFrom(StatisticRecord.PARAM_MAPPER)
                .execute(record)
                .onSuccess(r -> log.trace("Successfully created statistic record: %s".formatted(record.relatedId())))
                .onFailure(
                        err -> log.error("Failed to create statistic record: %s".formatted(err.getMessage()))
                )
                .mapEmpty();
    }

    @Override
    public Future<List<StatisticRecord>> getRangeStatistics(StatisticRecord.Type type,
                                                            long relatedId,
                                                            long startTime,
                                                            long endTime) {
        return SqlTemplate
                .forQuery(pool, """
                        SELECT *
                        FROM statistic_record
                        WHERE type = #{type}
                          AND related_id = #{relatedId}
                          AND timestamp >= #{startTime}
                          AND timestamp <= #{endTime}
                        ORDER BY timestamp
                        """)
                .mapTo(StatisticRecord.ROW_MAPPER)
                .execute(Map.of(
                        "type", type.name(),
                        "relatedId", relatedId,
                        "startTime", startTime,
                        "endTime", endTime
                ))
                .map(IterUtil::toList)
                .onFailure(
                        err -> log.error("Failed to get range statistics: %s".formatted(err.getMessage()))
                );
    }
}
