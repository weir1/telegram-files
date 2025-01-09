package telegram.files;


import cn.hutool.core.collection.IterUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.lang.Version;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.jdbcclient.JDBCConnectOptions;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.junit5.VertxExtension;
import io.vertx.junit5.VertxTestContext;
import io.vertx.sqlclient.PoolOptions;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import telegram.files.repository.SettingKey;

import java.util.Set;
import java.util.stream.Collectors;

@ExtendWith(VertxExtension.class)
public class DataVerticleMigrationTest {

    private static final Log log = LogFactory.get();

    @BeforeAll
    static void setUp() {
        log.debug("APP_ROOT: " + Config.APP_ROOT);
        log.debug("DATA_PATH:" + DataVerticle.getDataPath());
    }

    @AfterEach
    void tearDown() {
        String dataPath = DataVerticle.getDataPath();
        if (FileUtil.file(dataPath).exists()) {
            FileUtil.del(dataPath);
        }
    }

    @Test
    @DisplayName("Test new database initialization")
    void testNewDatabaseInitialization(Vertx vertx, VertxTestContext testContext) {
        initializeEmptyDatabase(vertx, testContext)
                .compose(v -> DataVerticle.settingRepository.getByKey(SettingKey.version))
                .onComplete(testContext.succeeding(version -> testContext.verify(() -> {
                    Assertions.assertEquals(new Version(Start.VERSION), version);
                    testContext.completeNow();
                })));
    }

    @Test
    @DisplayName("Test legacy database migration (pre-0.1.7, no version)")
    void testLegacyDatabaseMigration(Vertx vertx, VertxTestContext testContext) {
        initializeLegacyDatabase(vertx)
                .compose(v -> vertx.deployVerticle(new DataVerticle()))
                .compose(v -> DataVerticle.pool.getConnection())
                .compose(conn -> conn.query("PRAGMA table_info(file_record)").execute()
                        .compose(result -> {
                            testContext.verify(() -> {
                                // Verify whether there are new columns
                                Set<String> columnNames = IterUtil.toList(result).stream()
                                        .map(row -> row.getString("name"))
                                        .collect(Collectors.toSet());
                                Assertions.assertTrue(columnNames.contains("start_date"));
                                Assertions.assertTrue(columnNames.contains("completion_date"));
                            });
                            return conn.close();
                        }))
                .compose(v -> DataVerticle.settingRepository.getByKey(SettingKey.version))
                .onComplete(testContext.succeeding(version -> testContext.verify(() -> {
                    Assertions.assertEquals(new Version(Start.VERSION), version);
                    testContext.completeNow();
                })));
    }

    @Test
    @DisplayName("Test migration from 0.1.6 to current version")
    void testOldVersionMigration(Vertx vertx, VertxTestContext testContext) {
        initializeOldVersionDatabase(vertx)
                .compose(v -> vertx.deployVerticle(new DataVerticle()))
                .compose(v -> DataVerticle.pool.getConnection())
                .compose(conn -> conn.query("PRAGMA table_info(file_record)").execute()
                        .compose(result -> {
                            testContext.verify(() -> {
                                // Verify whether there are new columns
                                Set<String> columnNames = IterUtil.toList(result).stream()
                                        .map(row -> row.getString("name"))
                                        .collect(Collectors.toSet());
                                Assertions.assertTrue(columnNames.contains("start_date"));
                                Assertions.assertTrue(columnNames.contains("completion_date"));
                            });
                            return conn.close();
                        }))
                .compose(v -> DataVerticle.settingRepository.getByKey(SettingKey.version))
                .onComplete(testContext.succeeding(version -> testContext.verify(() -> {
                    Assertions.assertEquals(new Version(Start.VERSION), version);
                    testContext.completeNow();
                })));
    }

    private Future<Void> initializeEmptyDatabase(Vertx vertx, VertxTestContext testContext) {
        return vertx.deployVerticle(new DataVerticle())
                .compose(id -> {
                    // Verify that the database has been fully initialized
                    return DataVerticle.pool.getConnection()
                            .compose(conn -> conn.query("""
                                            SELECT name FROM sqlite_master 
                                            WHERE type='table' AND name IN ('setting_record', 'telegram_record', 'file_record', 'statistic_record')
                                            """).execute()
                                    .compose(result -> {
                                        testContext.verify(() -> {
                                            Assertions.assertEquals(4, result.size());
                                        });
                                        return conn.close();
                                    }));
                })
                .mapEmpty();
    }

    private Future<Void> initializeLegacyDatabase(Vertx vertx) {
        // Create an old version database without a version field
        return Future.succeededFuture()
                .compose(v -> {
                    JDBCPool tempPool = JDBCPool.pool(vertx,
                            new JDBCConnectOptions()
                                    .setJdbcUrl("jdbc:sqlite:%s".formatted(DataVerticle.getDataPath())),
                            new PoolOptions().setMaxSize(1).setName("temp-pool")
                    );
                    return tempPool.getConnection()
                            .compose(conn -> conn.query("""
                                            CREATE TABLE file_record (
                                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                file_id TEXT NOT NULL,
                                                file_name TEXT NOT NULL
                                            )
                                            """).execute()
                                    .compose(v2 -> conn.query("""
                                            INSERT INTO file_record (file_id, file_name) 
                                            VALUES ('123', 'test.txt')
                                            """).execute())
                                    .compose(v3 -> conn.close())
                                    .eventually(() -> tempPool.close()));
                });
    }

    private Future<Void> initializeOldVersionDatabase(Vertx vertx) {
        // Create a database with a version field but a lower version
        return Future.succeededFuture()
                .compose(v -> {
                    JDBCPool tempPool = JDBCPool.pool(vertx,
                            new JDBCConnectOptions()
                                    .setJdbcUrl("jdbc:sqlite:%s".formatted(DataVerticle.getDataPath())),
                            new PoolOptions().setMaxSize(1).setName("temp-pool")
                    );
                    return tempPool.getConnection()
                            .compose(conn -> conn.query("""
                                            CREATE TABLE setting_record (
                                                key TEXT PRIMARY KEY,
                                                value TEXT NOT NULL
                                            )
                                            """).execute()
                                    .compose(v2 -> conn.query("""
                                            INSERT INTO setting_record (key, value) 
                                            VALUES ('version', '0.1.6')
                                            """).execute())
                                    .compose(v3 -> conn.query("""
                                            CREATE TABLE file_record (
                                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                file_id TEXT NOT NULL,
                                                file_name TEXT NOT NULL
                                            )
                                            """).execute())
                                    .compose(v4 -> conn.close())
                                    .eventually(() -> tempPool.close()));
                });
    }
}
