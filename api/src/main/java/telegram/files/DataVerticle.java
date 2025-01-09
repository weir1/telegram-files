package telegram.files;

import cn.hutool.core.lang.Version;
import cn.hutool.core.util.StrUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.jdbcclient.JDBCConnectOptions;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.PoolOptions;
import io.vertx.sqlclient.SqlConnection;
import org.jooq.lambda.tuple.Tuple;
import telegram.files.repository.*;
import telegram.files.repository.impl.FileRepositoryImpl;
import telegram.files.repository.impl.SettingRepositoryImpl;
import telegram.files.repository.impl.StatisticRepositoryImpl;
import telegram.files.repository.impl.TelegramRepositoryImpl;

import java.io.File;
import java.util.List;

public class DataVerticle extends AbstractVerticle {

    private static final Log log = LogFactory.get();

    public static JDBCPool pool;

    public static FileRepository fileRepository;

    public static TelegramRepository telegramRepository;

    public static SettingRepository settingRepository;

    public static StatisticRepository statisticRepository;

    public void start(Promise<Void> stopPromise) {
        pool = JDBCPool.pool(vertx,
                new JDBCConnectOptions()
                        .setJdbcUrl("jdbc:sqlite:%s".formatted(getDataPath()))
                ,
                new PoolOptions().setMaxSize(16).setName("pool-tf")
        );
        settingRepository = new SettingRepositoryImpl(pool);
        telegramRepository = new TelegramRepositoryImpl(pool);
        fileRepository = new FileRepositoryImpl(pool);
        statisticRepository = new StatisticRepositoryImpl(pool);
        List<Definition> definitions = List.of(
                new SettingRecord.SettingRecordDefinition(),
                new TelegramRecord.TelegramRecordDefinition(),
                new FileRecord.FileRecordDefinition(),
                new StatisticRecord.StatisticRecordDefinition()
        );
        pool.getConnection()
                .compose(conn -> isCompletelyNewInitialization(conn).map(isNew -> Tuple.tuple(conn, isNew)))
                .compose(tuple -> Future.all(definitions.stream().map(d -> d.createTable(tuple.v1)).toList()).map(tuple))
                .compose(tuple -> settingRepository.<Version>getByKey(SettingKey.version).map(tuple::concat))
                .compose(tuple -> {
                    if (tuple.v2) return Future.succeededFuture();

                    SqlConnection conn = tuple.v1;
                    Version version = tuple.v3 == null ? new Version("0.0.0") : tuple.v3;
                    return Future.all(definitions.stream().map(d -> d.migrate(conn, version, new Version(Start.VERSION))).toList());
                })
                .compose(r ->
                        settingRepository.createOrUpdate(SettingKey.version.name(), Start.VERSION))
                .onSuccess(r -> {
                    log.info("Database initialized");
                    stopPromise.complete();
                })
                .onFailure(err -> {
                    log.error("Failed to initialize database: %s".formatted(err.getMessage()));
                    stopPromise.fail(err);
                });
    }

    @Override
    public void stop(Promise<Void> stopPromise) throws Exception {
        if (pool != null) {
            pool.close().onComplete(r -> {
                stopPromise.complete();
                if (r.succeeded()) {
                    log.debug("Data verticle stopped!");
                } else {
                    log.error("Failed to close data verticle: %s".formatted(r.cause().getMessage()));
                }
            });
        }
    }

    public static String getDataPath() {
        String dataPath = System.getenv("DATA_PATH");
        dataPath = StrUtil.blankToDefault(dataPath, "data.db");
        dataPath = Config.APP_ROOT + File.separator + dataPath;
        return dataPath;
    }

    private Future<Boolean> isCompletelyNewInitialization(SqlConnection conn) {
        return conn.query("""
                        SELECT name
                        FROM sqlite_master
                        WHERE type = 'table'
                        ORDER BY name;
                        """)
                .execute()
                .map(rs -> rs.size() == 0);
    }
}
